'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope, Search, Loader2 } from 'lucide-react'

interface Provider {
  id:               string
  firstName:        string
  lastName:         string
  firstNameNepali:  string | null
  lastNameNepali:   string | null
  email:            string | null
  phone:            string | null
  gender:           string | null
  role:             string
  branch:           { name: string } | null
}

export default function ProviderPicker({ providers }: { providers: Provider[] }) {
  const router            = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = providers.filter(p => {
    const q = query.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)  ||
      (p.firstNameNepali ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q)
    )
  })

  async function select(id: string) {
    setLoading(id)
    try {
      const res = await fetch('/api/provider-portal/select-provider', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: id }),
      })
      if (!res.ok) throw new Error('Failed')
      router.push('/provider-portal/dashboard')
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 pt-16 pb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Provider Portal</h1>
          <p className="text-xs text-blue-600 font-medium">Saathi Sneha Care</p>
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
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Stethoscope className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No providers found</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              disabled={!!loading}
              className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all text-left group disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                {p.firstName[0]}{p.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Dr. {p.firstName} {p.lastName}
                </p>
                {(p.firstNameNepali || p.lastNameNepali) && (
                  <p className="text-xs text-gray-500">{p.firstNameNepali} {p.lastNameNepali}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {p.branch && (
                    <span className="text-xs text-gray-400">{p.branch.name}</span>
                  )}
                  {p.email && (
                    <span className="text-xs text-gray-400">{p.email}</span>
                  )}
                </div>
              </div>
              {loading === p.id
                ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                : <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">Enter →</span>
              }
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          {providers.length} provider{providers.length !== 1 ? 's' : ''} registered
        </p>
      </div>
    </div>
  )
}
