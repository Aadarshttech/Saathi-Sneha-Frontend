import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { paymentStatus } from '@/lib/utils'
import AccountsListClient from './accounts-list-client'

export const metadata: Metadata = { title: 'Accounts' }

async function getAccounts() {
  const accounts = await prisma.caregiverAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, fullName: true, email: true, phone: true, country: true,
      emailVerified: true, createdAt: true,
      patients: {
        where: { isActive: true },
        select: {
          firstName: true, lastName: true,
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, stripeSubscriptionId: true } },
        },
      },
      _count: { select: { patients: true } },
    },
  })
  return accounts.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    paymentStatuses: a.patients.map(p => ({
      parentName: `${p.firstName} ${p.lastName}`,
      ...paymentStatus(p.subscriptions[0]),
    })),
  }))
}

export default async function AccountsPage() {
  const accounts = await getAccounts()

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1>Accounts</h1>
        <p className="text-sm text-brand-muted mt-0.5">Caregivers who have signed up for the family portal</p>
      </div>
      <AccountsListClient accounts={accounts} />
    </div>
  )
}
