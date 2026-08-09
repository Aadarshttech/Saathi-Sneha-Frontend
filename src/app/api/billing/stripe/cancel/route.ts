import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscriptionId } = body as { subscriptionId?: string }

    if (!subscriptionId || !UUID_RE.test(subscriptionId)) {
      return NextResponse.json({ error: 'Valid subscriptionId is required' }, { status: 400 })
    }

    // When called from the patient portal, enforce ownership
    const portalSession = getPortalSession()
    const sub = await prisma.patientSubscription.findUnique({ where: { id: subscriptionId } })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    if (portalSession && sub.patientId !== portalSession.patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!sub.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No Stripe subscription linked' }, { status: 400 })
    }

    // Cancel at period end so the patient keeps access until the renewal date
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true })

    await prisma.patientSubscription.update({
      where: { id: subscriptionId },
      data:  { autoRenew: false },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('Stripe cancel error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
