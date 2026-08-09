import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import CheckoutClient from './checkout-client'

export default async function PlansCheckoutPage({
  searchParams,
}: {
  searchParams: { subscriptionId?: string }
}) {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal/login')

  const subscriptionId = searchParams.subscriptionId
  if (!subscriptionId) redirect('/portal/plans')

  const subscription = await prisma.patientSubscription.findFirst({
    where:   { id: subscriptionId, patientId: session.patientId },
    include: { plan: { select: { name: true, nameNepali: true } } },
  })
  if (!subscription) redirect('/portal/plans')
  if (subscription.stripeSubscriptionId) redirect('/portal/dashboard')

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Payment Method</h1>
        <p className="text-sm text-gray-500 mt-1">Choose how you&apos;d like to pay for your plan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-gray-500">Plan</p>
            <p className="text-lg font-bold text-brand-dark">{subscription.plan.name}</p>
          </div>
          <p className="text-lg font-bold text-brand-dark">
            ${subscription.priceNpr.toLocaleString()}<span className="text-sm font-normal text-gray-400">/mo</span>
          </p>
        </div>
      </div>

      <CheckoutClient subscriptionId={subscription.id} />
    </div>
  )
}
