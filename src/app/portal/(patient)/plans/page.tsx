import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import PlansClient from './plans-client'

export default async function PortalPlansPage() {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal/login')

  const existingSubscription = await prisma.patientSubscription.findFirst({
    where: { patientId: session.patientId, status: 'active' },
  })
  // Only a subscription that actually completed Stripe checkout should lock this page —
  // one still missing a stripeSubscriptionId never finished payment, so let them retry.
  if (existingSubscription?.stripeSubscriptionId) redirect('/portal/dashboard')

  const plans = await prisma.subscriptionPlan.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand-dark">Choose a Care Plan</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
          No lock-in contracts. Cancel or upgrade anytime. Pay by card from anywhere in the world.
        </p>
      </div>
      {plans.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No plans available yet.</div>
      ) : (
        <PlansClient plans={plans} />
      )}
    </div>
  )
}
