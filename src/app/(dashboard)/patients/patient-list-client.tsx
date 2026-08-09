'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Table } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { formatDate, calculateAge, fullName } from '@/lib/utils'

interface Patient {
  id: string
  mrn: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  province:     string | null
  district:     string | null
  municipality: string | null
  primaryNurse: { firstName: string; lastName: string } | null
  _count: { visits: number }
}

const COLUMNS = [
  { key: 'mrn', header: 'MRN', className: 'w-32 font-mono text-xs text-brand-muted' },
  {
    key: 'name',
    header: 'Patient',
    render: (p: Patient) => (
      <div>
        <p className="font-medium text-brand-dark">{fullName(p)}</p>
        <p className="text-xs text-brand-muted">{p.phone}</p>
      </div>
    ),
  },
  {
    key: 'dob',
    header: 'Age / Gender',
    render: (p: Patient) => (
      <div>
        <p>{calculateAge(new Date(p.dateOfBirth))} yrs</p>
        <p className="text-xs text-brand-muted capitalize">{p.gender.replace('_', ' ')}</p>
      </div>
    ),
  },
  {
    key: 'location',
    header: 'Location',
    render: (p: Patient) => (
      <span className="text-sm">{[p.municipality, p.district].filter(Boolean).join(', ') || '—'}</span>
    ),
  },
  {
    key: 'nurse',
    header: 'Nurse',
    render: (p: Patient) => (
      <span className="text-sm">{p.primaryNurse ? fullName(p.primaryNurse) : <span className="text-brand-muted">Unassigned</span>}</span>
    ),
  },
  {
    key: 'visits',
    header: 'Visits',
    render: (p: Patient) => (
      <Badge variant="muted">{p._count.visits}</Badge>
    ),
  },
]

export default function PatientListClient() {
  const router = useRouter()
  const [query, setQuery]       = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [page, setPage]         = useState(1)

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ orgId: DEFAULT_ORG_ID, q, page: String(p), limit: '20' })
      const res = await fetch(`/api/patients?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Server error ${res.status}`)
      setPatients(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(query, page), 300)
    return () => clearTimeout(t)
  }, [query, page, load])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1) }}
          placeholder="Search by name, MRN, or phone…"
          className="h-9 w-full rounded-lg border border-brand-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      <p className="text-xs text-brand-muted">{total} patient{total !== 1 ? 's' : ''}</p>

      <Table
        columns={COLUMNS as never}
        data={patients}
        keyField="id"
        loading={loading}
        onRowClick={p => router.push(`/patients/${p.id}`)}
        emptyText="No patients found. Add your first patient."
      />

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center gap-3 justify-end">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="text-sm text-brand-muted disabled:opacity-40 hover:text-brand-dark"
          >
            ← Prev
          </button>
          <span className="text-xs text-brand-muted">Page {page} of {Math.ceil(total / 20)}</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(p => p + 1)}
            className="text-sm text-brand-muted disabled:opacity-40 hover:text-brand-dark"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
