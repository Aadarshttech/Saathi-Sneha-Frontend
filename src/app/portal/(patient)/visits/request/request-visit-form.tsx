'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { SERVICE_CODE_LABELS } from '@/lib/constants'

export default function RequestVisitForm() {
  const router = useRouter()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ scheduledAt: '', serviceCode: '', notes: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/visits/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Please check the form and try again.'); return }
      router.push('/portal/visits')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-brand-red'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-gray-200 p-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className={labelClass}>Preferred Date &amp; Time <span className="text-brand-red">*</span></label>
        <input
          type="datetime-local"
          required
          className={inputClass}
          value={form.scheduledAt}
          onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
        />
        <p className="text-xs text-gray-400 mt-1">Our care team will confirm the exact time based on nurse availability.</p>
      </div>

      <div>
        <label className={labelClass}>Type of Visit <span className="text-brand-red">*</span></label>
        <select
          required
          className={inputClass}
          value={form.serviceCode}
          onChange={e => setForm(f => ({ ...f, serviceCode: e.target.value }))}
        >
          <option value="">Select…</option>
          {Object.entries(SERVICE_CODE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Notes <span className="text-gray-400 text-xs">(optional)</span></label>
        <textarea
          rows={4}
          className={inputClass}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Anything the care team should know before the visit…"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-red text-white rounded-xl font-bold text-sm hover:bg-brand-red-dark transition-colors disabled:opacity-60"
      >
        {loading ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  )
}
