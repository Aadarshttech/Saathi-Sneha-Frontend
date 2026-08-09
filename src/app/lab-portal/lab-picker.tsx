'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Search, Loader2 } from 'lucide-react'

interface LabStaff {
  id:              string
  firstName:       string
  lastName:        string
  firstNameNepali: string | null
  lastNameNepali:  string | null
  email:           string | null
  phone:           string | null
  gender:          string | null
  role:            string
  branch:          { name: string } | null
}

export default function LabPicker({ staff }: { staff: LabStaff[] }) {
  const router            = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = staff.filter(s => {
    const q = query.toLowerCase()
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q)  ||
      (s.firstNameNepali ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    )
  })

  async function select(id: string) {
    setLoading(id)
    try {
      const res = await fetch('/api/lab-portal/select-staff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: id }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/lab-portal/dashboard')
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 pt-16 pb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lab Portal</h1>
          <p className="text-xs text-emerald-600 font-medium">Saathi Sneha Care</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-8">Select your account to continue</p>

      <div className="w-full max-w-lg">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No lab staff found</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              disabled={!!loading}
              className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all text-left group disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                {s.firstName[0]}{s.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {s.firstName} {s.lastName}
                </p>
                {(s.firstNameNepali || s.lastNameNepali) && (
                  <p className="text-xs text-gray-500">{s.firstNameNepali} {s.lastNameNepali}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-xs font-medium text-emerald-600">Lab Technician</span>
                  {s.branch && <span className="text-xs text-gray-400">{s.branch.name}</span>}
                  {s.email  && <span className="text-xs text-gray-400">{s.email}</span>}
                </div>
              </div>
              {loading === s.id
                ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                : <span className="text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">Enter →</span>
              }
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          {staff.length} lab staff registered
        </p>
      </div>
    </div>
  )
}
