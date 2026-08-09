import { NextRequest, NextResponse } from 'next/server'
import { stripe, toStripeAmount } from '@/lib/stripe'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_SUCCESS_PATHS = ['/billing', '/portal/dashboard']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscriptionId, successPath } = body as { subscriptionId?: string; successPath?: string }
    const resolvedSuccessPath = successPath && ALLOWED_SUCCESS_PATHS.includes(successPath) ? successPath : '/billing'

    if (!subscriptionId || !UUID_RE.test(subscriptionId)) {
      return NextResponse.json({ error: 'Valid subscriptionId is required' }, { status: 400 })
    }

    // When called from the patient portal, enforce ownership
    const portalSession = getPortalSession()
    const sub = await prisma.patientSubscription.findUnique({
      where:   { id: subscriptionId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true, stripeCustomerId: true },
        },
        plan: { select: { name: true } },
      },
    })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    if (portalSession && sub.patientId !== portalSession.patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (sub.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Stripe subscription already active' }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = sub.patient.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name:     `${sub.patient.firstName} ${sub.patient.lastName}`,
        email:    sub.patient.email ?? undefined,
        metadata: { patientId: sub.patient.id },
      })
      stripeCustomerId = customer.id
      await prisma.patient.update({
        where: { id: sub.patient.id },
        data:  { stripeCustomerId },
      })
    }

    // Create an inline price object for this subscription's monthly rate.
    // sub.priceNpr holds the amount in USD (column name is legacy; see the
    // one-time NPR->USD data conversion in git history).
    const price = await stripe.prices.create({
      currency:     'usd',
      unit_amount:  toStripeAmount(sub.priceNpr),
      recurring:    { interval: 'month' },
      product_data: { name: `${sub.plan.name} — Monthly` },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer:             stripeCustomerId,
      payment_method_types: ['card'],
      mode:                 'subscription',
      line_items:           [{ price: price.id, quantity: 1 }],
      metadata:             { subscriptionId, patientId: sub.patient.id },
      success_url:          `${appUrl}${resolvedSuccessPath}?stripe_sub_success=1&sub=${encodeURIComponent(subscriptionId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:           `${appUrl}/billing?stripe_cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('Stripe subscription error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
