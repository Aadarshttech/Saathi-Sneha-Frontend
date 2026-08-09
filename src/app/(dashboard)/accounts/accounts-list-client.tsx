'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface PaymentStatusEntry {
  parentName: string
  label: string
  variant: 'success' | 'warning' | 'danger' | 'muted'
}

interface Account {
  id: string
  fullName: string
  email: string
  phone: string | null
  country: string | null
  emailVerified: boolean
  createdAt: string
  paymentStatuses: PaymentStatusEntry[]
  _count: { patients: number }
}

const COLUMNS = [
  {
    key: 'name',
    header: 'Caregiver',
    render: (a: Account) => (
      <div>
        <p className="font-medium text-brand-dark">{a.fullName}</p>
        <p className="text-xs text-brand-muted">{a.email}</p>
      </div>
    ),
  },
  {
    key: 'contact',
    header: 'Contact',
    render: (a: Account) => (
      <div>
        <p className="text-sm">{a.phone ?? '—'}</p>
        <p className="text-xs text-brand-muted">{a.country ?? '—'}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (a: Account) => (
      <Badge variant={a.emailVerified ? 'success' : 'warning'}>
        {a.emailVerified ? 'Verified' : 'Unverified'}
      </Badge>
    ),
  },
  {
    key: 'parents',
    header: 'Parents Linked',
    render: (a: Account) => (
      <Badge variant="muted">{a._count.patients}</Badge>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Payment Status',
    render: (a: Account) => (
      a.paymentStatuses.length === 0 ? (
        <span className="text-xs text-brand-muted">—</span>
      ) : (
        <div className="space-y-1">
          {a.paymentStatuses.map((ps, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {a.paymentStatuses.length > 1 && (
                <span className="text-xs text-brand-muted">{ps.parentName}:</span>
              )}
              <Badge variant={ps.variant}>{ps.label}</Badge>
            </div>
          ))}
        </div>
      )
    ),
  },
  {
    key: 'createdAt',
    header: 'Signed Up',
    render: (a: Account) => (
      <span className="text-sm text-brand-muted">{formatDate(a.createdAt)}</span>
    ),
  },
]

export default function AccountsListClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter(a =>
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.phone ?? '').toLowerCase().includes(q)
    )
  }, [accounts, query])

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="h-9 w-full rounded-lg border border-brand-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
        />
      </div>

      <p className="text-xs text-brand-muted">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</p>

      <Table
        columns={COLUMNS as never}
        data={filtered}
        keyField="id"
        onRowClick={a => router.push(`/accounts/${a.id}`)}
        emptyText="No caregiver accounts yet."
      />
    </div>
  )
}
