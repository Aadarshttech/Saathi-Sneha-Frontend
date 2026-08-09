import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Mail, Phone, Globe, Heart } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui/table'
import { formatDate, calculateAge, fullName, paymentStatus } from '@/lib/utils'

export const metadata: Metadata = { title: 'Account Detail' }

async function getAccount(id: string) {
  return prisma.caregiverAccount.findUnique({
    where: { id },
    include: {
      patients: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, mrn: true, firstName: true, lastName: true,
          dateOfBirth: true, gender: true, phone: true,
          primaryNurse:  { select: { firstName: true, lastName: true } },
          primaryDoctor: { select: { firstName: true, lastName: true } },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            select: { status: true, stripeSubscriptionId: true, plan: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
  })
}

const PARENT_COLUMNS = [
  {
    key: 'name',
    header: 'Parent',
    render: (p: NonNullable<Awaited<ReturnType<typeof getAccount>>>['patients'][number]) => (
      <Link href={`/patients/${p.id}`} className="block hover:underline">
        <p className="font-medium text-brand-red">{fullName(p)}</p>
        <p className="text-xs text-brand-muted font-mono">{p.mrn}</p>
      </Link>
    ),
  },
  {
    key: 'age',
    header: 'Age / Gender',
    render: (p: NonNullable<Awaited<ReturnType<typeof getAccount>>>['patients'][number]) => (
      <div>
        <p>{calculateAge(p.dateOfBirth)} yrs</p>
        <p className="text-xs text-brand-muted capitalize">{p.gender}</p>
      </div>
    ),
  },
  {
    key: 'nurse',
    header: 'Care Team',
    render: (p: NonNullable<Awaited<ReturnType<typeof getAccount>>>['patients'][number]) => (
      <div className="text-sm">
        <p>{p.primaryNurse ? fullName(p.primaryNurse) : <span className="text-brand-muted">No nurse</span>}</p>
        <p className="text-xs text-brand-muted">{p.primaryDoctor ? `Dr. ${fullName(p.primaryDoctor)}` : 'No doctor'}</p>
      </div>
    ),
  },
  {
    key: 'plan',
    header: 'Care Plan',
    render: (p: NonNullable<Awaited<ReturnType<typeof getAccount>>>['patients'][number]) => {
      const sub = p.subscriptions[0]
      const ps = paymentStatus(sub)
      return (
        <div className="space-y-1">
          {sub && <p className="text-sm text-brand-dark">{sub.plan.name}</p>}
          <Badge variant={ps.variant}>{ps.label}</Badge>
        </div>
      )
    },
  },
]

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  const account = await getAccount(params.id)
  if (!account) notFound()

  return (
    <div className="p-6 space-y-5">
      <div>
        <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark mb-3">
          <ChevronLeft className="w-4 h-4" /> Accounts
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{account.fullName}</h1>
            {account.relationshipToPatient && (
              <p className="text-sm text-brand-muted mt-0.5">{account.relationshipToPatient}</p>
            )}
          </div>
          <Badge variant={account.emailVerified ? 'success' : 'warning'}>
            {account.emailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-brand-border p-5">
        <h2 className="text-sm font-semibold text-brand-dark mb-3">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-brand-muted shrink-0" />
            {account.email}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-brand-muted shrink-0" />
            {account.phone ?? '—'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-brand-muted shrink-0" />
            {account.country ?? '—'}
          </div>
        </div>
        <p className="text-xs text-brand-muted mt-3">
          Signed up {formatDate(account.createdAt)}
          {account.lastLoginAt && <> · Last login {formatDate(account.lastLoginAt)}</>}
        </p>
      </div>

      {/* Linked parents */}
      <div>
        <h2 className="text-sm font-semibold text-brand-dark mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-brand-red" />
          Parents Tied to This Account ({account.patients.length})
        </h2>
        <Table
          columns={PARENT_COLUMNS as never}
          data={account.patients}
          keyField="id"
          emptyText="No parents linked to this account yet."
        />
      </div>
    </div>
  )
}
