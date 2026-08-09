import { NextRequest, NextResponse } from 'next/server'
import { stripe, toStripeAmount } from '@/lib/stripe'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, source } = body as { invoiceId?: string; source?: string }

    if (!invoiceId || !UUID_RE.test(invoiceId)) {
      return NextResponse.json({ error: 'Valid invoiceId is required' }, { status: 400 })
    }

    // When called from the patient portal, enforce ownership so a patient cannot
    // pay another patient's invoice by guessing IDs
    const portalSession = getPortalSession()
    const invoice = await prisma.invoice.findUnique({
      where:   { id: invoiceId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true, stripeCustomerId: true },
        },
      },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    if (portalSession && invoice.patientId !== portalSession.patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const outstanding = invoice.totalNpr - invoice.paidNpr
    if (outstanding <= 0) return NextResponse.json({ error: 'Invoice already fully paid' }, { status: 400 })

    // Get or create Stripe customer record for this patient
    let stripeCustomerId = invoice.patient.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name:     `${invoice.patient.firstName} ${invoice.patient.lastName}`,
        email:    invoice.patient.email ?? undefined,
        metadata: { patientId: invoice.patient.id },
      })
      stripeCustomerId = customer.id
      await prisma.patient.update({
        where: { id: invoice.patient.id },
        data:  { stripeCustomerId },
      })
    }

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const billingPath = source === 'portal' ? '/portal/billing' : '/billing'

    const session = await stripe.checkout.sessions.create({
      customer:             stripeCustomerId,
      payment_method_types: ['card'],
      mode:                 'payment',
      line_items: [{
        price_data: {
          currency:     'npr',
          product_data: { name: `Invoice ${invoice.invoiceNo}` },
          unit_amount:  toStripeAmount(outstanding),
        },
        quantity: 1,
      }],
      metadata:    { invoiceId, patientId: invoice.patient.id },
      success_url: `${appUrl}${billingPath}?stripe_success=1&invoice=${encodeURIComponent(invoiceId)}`,
      cancel_url:  `${appUrl}${billingPath}?stripe_cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('Stripe checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
