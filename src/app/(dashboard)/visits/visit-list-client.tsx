'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Table } from '@/components/ui/table'
import { VisitStatusBadge } from '@/components/ui/badge'
import { DEFAULT_ORG_ID, VISIT_STATUS_LABELS } from '@/lib/constants'
import { formatDateTime, fullName } from '@/lib/utils'

interface Visit {
  id: string
  visitType: string
  status: string
  scheduledAt: string
  patient: { id: string; mrn: string; firstName: string; lastName: string; phone: string }
  nurse:   { id: string; firstName: string; lastName: string } | null
  tasks:   { id: string; serviceCode: string; status: string }[]
}

const STATUS_FILTERS = ['', 'requested', 'scheduled', 'en_route', 'checked_in', 'in_progress', 'completed', 'cancelled']

const COLUMNS = [
  {
    key: 'patient', header: 'Patient',
    render: (v: Visit) => (
      <div>
        <p className="font-medium text-brand-dark">{fullName(v.patient)}</p>
        <p className="text-xs text-brand-muted font-mono">{v.patient.mrn}</p>
      </div>
    ),
  },
  {
    key: 'scheduledAt', header: 'Scheduled',
    render: (v: Visit) => <span className="text-sm">{formatDateTime(v.scheduledAt)}</span>,
  },
  {
    key: 'type', header: 'Type',
    render: (v: Visit) => <span className="text-sm capitalize">{v.visitType?.replace(/_/g, ' ')}</span>,
  },
  {
    key: 'nurse', header: 'Nurse',
    render: (v: Visit) => (
      <span className="text-sm">{v.nurse ? fullName(v.nurse) : <span className="text-brand-muted">Unassigned</span>}</span>
    ),
  },
  {
    key: 'services', header: 'Services',
    render: (v: Visit) => <span className="text-sm text-brand-muted">{v.tasks.length} service{v.tasks.length !== 1 ? 's' : ''}</span>,
  },
  {
    key: 'status', header: 'Status',
    render: (v: Visit) => <VisitStatusBadge status={v.status} />,
  },
]

export default function VisitListClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId') ?? ''

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]     = useState(today)
  const [status, setStatus] = useState('')
  const [visits, setVisits] = useState<Visit[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)

  const load = useCallback(async (d: string, s: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ orgId: DEFAULT_ORG_ID, page: String(p), limit: '20' })
      if (d)         params.set('date', d)
      if (s)         params.set('status', s)
      if (patientId) params.set('patientId', patientId)
      const res  = await fetch(`/api/visits?${params}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setVisits(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      // loading=false still runs; table will show empty state
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { load(date, status, page) }, [date, status, page, load])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={date}
          onChange={e => { setDate(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-brand-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
        />
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s
                  ? 'bg-brand-red text-white'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-dark'
              }`}
            >
              {s ? VISIT_STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-brand-muted">{total} visit{total !== 1 ? 's' : ''}</p>

      <Table
        columns={COLUMNS as never}
        data={visits}
        keyField="id"
        loading={loading}
        onRowClick={v => router.push(`/visits/${v.id}`)}
        emptyText="No visits found for this date."
      />

      {total > 20 && (
        <div className="flex items-center gap-3 justify-end">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm text-brand-muted disabled:opacity-40 hover:text-brand-dark">← Prev</button>
          <span className="text-xs text-brand-muted">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="text-sm text-brand-muted disabled:opacity-40 hover:text-brand-dark">Next →</button>
        </div>
      )}
    </div>
  )
}
