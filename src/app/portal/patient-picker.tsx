'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, User } from 'lucide-react'

interface PatientRow {
  id:              string
  firstName:       string
  lastName:        string
  firstNameNepali: string | null
  mrn:             string
  age:             number
  gender:          string
  chronicConditions: string[]
  nurseName:       string | null
}

export default function PatientPicker({ patients }: { patients: PatientRow[] }) {
  const router = useRouter()
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = patients.filter(p => {
    const q = query.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)  ||
      p.mrn.toLowerCase().includes(q)       ||
      (p.firstNameNepali ?? '').includes(q)
    )
  })

  async function select(id: string) {
    setLoading(id)
    const res = await fetch('/api/portal/select-patient', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ patientId: id }),
    })
    if (res.ok) {
      router.push('/portal/dashboard')
      router.refresh()
    } else {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or MRN…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-brand-red shadow-sm"
        />
      </div>

      {/* Patient list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <User className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No patients found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(p => (
              <li key={p.id}>
                <button
                  onClick={() => select(p.id)}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-sm font-bold shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {p.firstName} {p.lastName}
                      </span>
                      {p.firstNameNepali && (
                        <span className="text-xs text-gray-400">{p.firstNameNepali}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">{p.mrn}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {p.age}y {p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'O'}
                      </span>
                      {p.nurseName && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{p.nurseName}</span>
                        </>
                      )}
                    </div>
                    {p.chronicConditions.length > 0 && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {p.chronicConditions.slice(0, 2).join(' · ')}
                        {p.chronicConditions.length > 2 && ` +${p.chronicConditions.length - 2}`}
                      </p>
                    )}
                  </div>

                  {/* Arrow / spinner */}
                  {loading === p.id ? (
                    <div className="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
