import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getPortalSession } from '@/lib/portal-auth'

export async function POST(request: NextRequest) {
  const session = getPortalSession()
  if (!session || !session.patientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planId } = await request.json()
  if (!planId) {
    return NextResponse.json({ error: 'planId is required.' }, { status: 400 })
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
  }

  const existing = await prisma.patientSubscription.findFirst({
    where: { patientId: session.patientId, status: 'active' },
  })

  // A subscription with no Stripe id yet never actually completed payment —
  // let the caller retry checkout on it instead of getting stuck on a 409.
  if (existing && existing.stripeSubscriptionId) {
    return NextResponse.json({ error: 'Already subscribed.' }, { status: 409 })
  }

  const subscription = existing
    ? await prisma.patientSubscription.update({
        where: { id: existing.id },
        data:  { planId: plan.id, priceNpr: plan.priceMinNpr },
      })
    : await prisma.patientSubscription.create({
        data: {
          patientId: session.patientId,
          planId:    plan.id,
          status:    'active',
          priceNpr:  plan.priceMinNpr,
          startDate: new Date(),
          payerType: 'family_overseas',
        },
      })

  return NextResponse.json({ ok: true, subscriptionId: subscription.id })
}
