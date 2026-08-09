'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { Loader2, CheckSquare, Square } from 'lucide-react'

interface Patient  { id: string; mrn: string; firstName: string; lastName: string }
interface Nurse    { id: string; firstName: string; lastName: string }
interface Service  { code: string; nameEn: string; category: string }

const VISIT_TYPES = [
  { value: 'wellness_check',  label: 'Wellness Check' },
  { value: 'follow_up',       label: 'Follow-up Visit' },
  { value: 'post_discharge',  label: 'Post-Discharge Care' },
  { value: 'chronic_care',    label: 'Chronic Care' },
  { value: 'urgent',          label: 'Urgent Visit' },
]

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-xs font-medium text-gray-600 mb-1'

export default function ScheduleVisitFormPortal({
  providerId,
  providerName,
  patients,
  nurses,
  services,
}: {
  providerId:   string
  providerName: string
  patients:     Patient[]
  nurses:       Nurse[]
  services:     Service[]
}) {
  const router = useRouter()

  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  const defaultDt = now.toISOString().slice(0, 16)

  const [patientId,    setPatientId]    = useState('')
  const [nurseId,      setNurseId]      = useState('')
  const [visitType,    setVisitType]    = useState('wellness_check')
  const [scheduledAt,  setScheduledAt]  = useState(defaultDt)
  const [durationMin,  setDurationMin]  = useState(60)
  const [notes,        setNotes]        = useState('')
  const [selectedSvcs, setSelectedSvcs] = useState<string[]>([])
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')

  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)  ||
      p.mrn.toLowerCase().includes(q)
    )
  })

  function toggleService(code: string) {
    setSelectedSvcs(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!patientId)           { setError('Please select a patient'); return }
    if (selectedSvcs.length === 0) { setError('Select at least one service'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/visits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orgId:       DEFAULT_ORG_ID,
          patientId,
          providerId,
          nurseId:     nurseId || undefined,
          visitType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMin,
          notes:       notes || undefined,
          tasks:       selectedSvcs.map(code => ({ serviceCode: code })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(JSON.stringify(json.error ?? json)); setSaving(false); return }
      router.push(`/provider-portal/visits/${json.data.id}`)
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
    }
  }

  const scheduledSvcs = services.filter(s => s.category === 'scheduled')
  const onDemandSvcs  = services.filter(s => s.category === 'on_demand')

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Visit Details card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Visit Details</h2>

        {/* Patient search */}
        <div>
          <label className={LABEL}>Patient *</label>
          <input
            type="text"
            placeholder="Search by name or MRN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={INPUT + ' mb-2'}
          />
          {search && (
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400">No patients found</p>
              ) : (
                filteredPatients.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPatientId(p.id); setSearch(`${p.firstName} ${p.lastName} (${p.mrn})`) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${patientId === p.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'}`}
                  >
                    {p.firstName} {p.lastName} <span className="text-gray-400 font-normal">({p.mrn})</span>
                  </button>
                ))
              )}
            </div>
          )}
          {!search && patientId && (
            <button type="button" onClick={() => { setSearch(''); setPatientId('') }}
              className="text-xs text-gray-400 hover:text-red-500">Clear patient</button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Visit Type *</label>
            <select value={visitType} onChange={e => setVisitType(e.target.value)} className={INPUT} required>
              {VISIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>Assign Nurse</label>
            <select value={nurseId} onChange={e => setNurseId(e.target.value)} className={INPUT}>
              <option value="">Unassigned</option>
              {nurses.map(n => <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL}>Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className={INPUT}
              required
            />
          </div>

          <div>
            <label className={LABEL}>Duration (minutes)</label>
            <input
              type="number"
              min={15} max={480} step={15}
              value={durationMin}
              onChange={e => setDurationMin(Number(e.target.value))}
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Provider</label>
            <input value={providerName} disabled className={INPUT + ' bg-gray-50 text-gray-500'} />
          </div>
        </div>

        <div>
          <label className={LABEL}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Special instructions or notes…"
            className={INPUT + ' resize-none'}
          />
        </div>
      </div>

      {/* Services card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Services *</h2>
        <p className="text-xs text-gray-400 mb-4">Select services to be performed during this visit</p>
        {selectedSvcs.length === 0 && error?.includes('service') && (
          <p className="text-xs text-red-600 mb-3">Select at least one service</p>
        )}

        {scheduledSvcs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Scheduled Services</p>
            <div className="grid grid-cols-2 gap-2">
              {scheduledSvcs.map(s => {
                const checked = selectedSvcs.includes(s.code)
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => toggleService(s.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      checked
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 shrink-0 text-blue-600" />
                      : <Square className="w-4 h-4 shrink-0 text-gray-300" />
                    }
                    {s.nameEn}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {onDemandSvcs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">On-Demand Services</p>
            <div className="grid grid-cols-2 gap-2">
              {onDemandSvcs.map(s => {
                const checked = selectedSvcs.includes(s.code)
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => toggleService(s.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      checked
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 shrink-0 text-blue-600" />
                      : <Square className="w-4 h-4 shrink-0 text-gray-300" />
                    }
                    {s.nameEn}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedSvcs.length > 0 && (
          <p className="text-xs text-blue-600 mt-3">{selectedSvcs.length} service{selectedSvcs.length > 1 ? 's' : ''} selected</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Schedule Visit
        </button>
      </div>
    </form>
  )
}
