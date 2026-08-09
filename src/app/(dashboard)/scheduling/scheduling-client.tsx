'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, X, Plus, Trash2,
  Clock, UserX, CalendarDays, Save, Check, CalendarPlus, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SERVICE_CODE_LABELS, VISIT_STATUS_COLORS, VISIT_STATUS_LABELS, DEFAULT_ORG_ID } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailSlot {
  id: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean
}
export interface TimeOff {
  id: string; date: string; reason: string | null; isFullDay: boolean
}
export interface StaffData {
  id: string; role: 'provider' | 'nurse'
  firstName: string; lastName: string
  firstNameNepali: string | null; lastNameNepali: string | null
  availability: AvailSlot[]; timeOff: TimeOff[]
}
export interface VisitData {
  id: string; scheduledAt: string; status: string; serviceCode: string | null
  nurseId: string | null; providerId: string | null
  patient: { id: string; firstName: string; lastName: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const STAFF_PALETTE = [
  { dot: 'bg-blue-500',   cell: 'bg-blue-50 text-blue-700 border-blue-200' },
  { dot: 'bg-purple-500', cell: 'bg-purple-50 text-purple-700 border-purple-200' },
  { dot: 'bg-indigo-500', cell: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { dot: 'bg-cyan-500',   cell: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { dot: 'bg-teal-500',   cell: 'bg-teal-50 text-teal-700 border-teal-200' },
  { dot: 'bg-emerald-500',cell: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { dot: 'bg-amber-500',  cell: 'bg-amber-50 text-amber-700 border-amber-200' },
  { dot: 'bg-rose-500',   cell: 'bg-rose-50 text-rose-700 border-rose-200' },
]

// ─── Date utilities ───────────────────────────────────────────────────────────

function getThisMonday(): Date {
  const d   = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(d.getDate() + n); return r
}

function isoDate(d: Date): string {
  return d.toISOString().substring(0, 10)
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${ap}` : `${h12}:${String(m).padStart(2, '0')}${ap}`
}

function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const mo = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const su = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${mo} – ${su}`
}

// ─── Availability cell ────────────────────────────────────────────────────────

function AvailCell({ slot, onTimeOff, dayVisits, palette }: {
  slot:      AvailSlot | undefined
  onTimeOff: boolean
  dayVisits: VisitData[]
  palette:   typeof STAFF_PALETTE[0]
}) {
  return (
    <div className="space-y-1 min-w-[100px]">
      {/* Availability badge */}
      {onTimeOff ? (
        <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium border border-red-200">
          <UserX className="w-3 h-3" /> Off
        </span>
      ) : slot?.isActive ? (
        <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border font-medium ${palette.cell}`}>
          <Clock className="w-2.5 h-2.5" />
          {fmt12(slot.startTime)}–{fmt12(slot.endTime)}
        </span>
      ) : (
        <span className="text-xs text-brand-muted/30">—</span>
      )}

      {/* Visit entries inline */}
      {dayVisits.map(v => (
        <Link
          key={v.id}
          href={`/visits/${v.id}`}
          onClick={e => e.stopPropagation()}
          className="block text-[10px] bg-brand-red/10 border border-brand-red/25 rounded px-1.5 py-0.5 text-brand-dark hover:bg-brand-red/20 transition-colors leading-tight"
        >
          <span className="font-semibold">
            {new Date(v.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
          {' '}
          <span className="truncate">
            {v.patient.firstName} {v.patient.lastName[0]}.
          </span>
          {v.serviceCode && (
            <span className="block text-brand-muted truncate">
              {SERVICE_CODE_LABELS[v.serviceCode] ?? v.serviceCode}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── Day schedule row (editable) ─────────────────────────────────────────────

function DayRow({ dow, slot, onSave, onRemove }: {
  dow:      number
  slot:     AvailSlot | undefined
  onSave:   (dow: number, startTime: string, endTime: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [editing, setEditing]   = useState(false)
  const [start,   setStart]     = useState(slot?.startTime ?? '09:00')
  const [end,     setEnd]       = useState(slot?.endTime   ?? '17:00')
  const [saving,  setSaving]    = useState(false)

  const save = async () => {
    setSaving(true)
    try { await onSave(dow, start, end); setEditing(false) }
    finally { setSaving(false) }
  }

  const remove = async () => {
    if (!slot) return
    setSaving(true)
    try { await onRemove(slot.id) }
    finally { setSaving(false) }
  }

  const active = slot?.isActive ?? false

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${active ? 'border-brand-border bg-white' : 'border-brand-border/40 bg-brand-surface/40'}`}>
      <div className="w-24 shrink-0">
        <p className={`text-sm font-medium ${active ? 'text-brand-dark' : 'text-brand-muted'}`}>{DAY_FULL[dow]}</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input type="time" value={start} onChange={e => setStart(e.target.value)}
            className="h-7 rounded border border-brand-border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
          <span className="text-brand-muted text-sm">to</span>
          <input type="time" value={end} onChange={e => setEnd(e.target.value)}
            className="h-7 rounded border border-brand-border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
          <Button size="sm" loading={saving} onClick={save}><Check className="w-3.5 h-3.5" /> Save</Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-1">
          {active ? (
            <span className="text-sm text-brand-dark">{fmt12(slot!.startTime)} – {fmt12(slot!.endTime)}</span>
          ) : (
            <span className="text-sm text-brand-muted italic">Not working</span>
          )}
          <div className="flex-1" />
          <button onClick={() => setEditing(true)}
            className="text-xs text-brand-blue hover:underline">
            {active ? 'Edit' : 'Set hours'}
          </button>
          {active && slot && (
            <button onClick={remove} disabled={saving}
              className="text-xs text-red-400 hover:text-red-600">
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Staff detail panel ───────────────────────────────────────────────────────

type PanelTab = 'schedule' | 'timeoff' | 'visits'

function StaffPanel({ staff, visits, weekStart, onClose, onAvailChange, onTimeOffChange }: {
  staff:           StaffData
  visits:          VisitData[]
  weekStart:       Date
  onClose:         () => void
  onAvailChange:   (updated: AvailSlot[]) => void
  onTimeOffChange: (updated: TimeOff[])   => void
}) {
  const [tab,           setTab]           = useState<PanelTab>('schedule')
  const [toDate,        setToDate]        = useState('')
  const [toReason,      setToReason]      = useState('')
  const [addingTimeOff, setAddingTimeOff] = useState(false)
  const [savingTimeOff, setSavingTimeOff] = useState(false)
  const [toErr,         setToErr]         = useState<string | null>(null)

  const weekEnd = addDays(weekStart, 6)
  const weekVisits = visits.filter(v => {
    const d = new Date(v.scheduledAt)
    return d >= weekStart && d <= weekEnd &&
      (v.nurseId === staff.id || v.providerId === staff.id)
  })

  const saveAvail = async (dow: number, startTime: string, endTime: string) => {
    const res  = await fetch('/api/scheduling/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: staff.id, dayOfWeek: dow, startTime, endTime, isActive: true }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    const existing = staff.availability.find(a => a.dayOfWeek === dow)
    const updated  = existing
      ? staff.availability.map(a => a.dayOfWeek === dow ? { ...a, ...json.data, isActive: true } : a)
      : [...staff.availability, json.data]
    onAvailChange(updated)
  }

  const removeAvail = async (id: string) => {
    const res = await fetch(`/api/scheduling/availability/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed')
    onAvailChange(staff.availability.filter(a => a.id !== id))
  }

  const addTimeOff = async () => {
    if (!toDate) { setToErr('Date is required'); return }
    setSavingTimeOff(true); setToErr(null)
    try {
      const res  = await fetch('/api/scheduling/timeoff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: staff.id, date: toDate, reason: toReason || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onTimeOffChange([...staff.timeOff, json.data].sort((a, b) => a.date.localeCompare(b.date)))
      setToDate(''); setToReason(''); setAddingTimeOff(false)
    } catch (e: unknown) { setToErr((e as Error).message) }
    finally { setSavingTimeOff(false) }
  }

  const removeTimeOff = async (id: string) => {
    await fetch(`/api/scheduling/timeoff/${id}`, { method: 'DELETE' })
    onTimeOffChange(staff.timeOff.filter(t => t.id !== id))
  }

  const TABS: { id: PanelTab; label: string }[] = [
    { id: 'schedule', label: 'Weekly Schedule' },
    { id: 'timeoff',  label: `Time Off (${staff.timeOff.length})` },
    { id: 'visits',   label: `This Week (${weekVisits.length})` },
  ]

  return (
    <div className="border border-brand-border rounded-xl bg-white overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-surface/60">
        <div className="flex-1">
          <p className="font-semibold text-brand-dark text-sm">
            {staff.firstName} {staff.lastName}
            {(staff.firstNameNepali || staff.lastNameNepali) && (
              <span className="text-brand-muted font-normal ml-2 text-xs">
                {[staff.firstNameNepali, staff.lastNameNepali].filter(Boolean).join(' ')}
              </span>
            )}
          </p>
          <p className="text-xs text-brand-muted capitalize">{staff.role === 'provider' ? 'Doctor / Provider' : 'Nurse'}</p>
        </div>
        {/* Tab bar */}
        <div className="flex gap-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id ? 'bg-brand-dark text-white' : 'text-brand-muted hover:bg-brand-border/40'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-brand-border/40 text-brand-muted">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Schedule tab */}
      {tab === 'schedule' && (
        <div className="p-4">
          <p className="text-xs text-brand-muted mb-3">Set which days and hours this staff member is available each week.</p>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map(dow => (
              <DayRow key={dow} dow={dow}
                slot={staff.availability.find(a => a.dayOfWeek === dow)}
                onSave={saveAvail}
                onRemove={removeAvail}
              />
            ))}
          </div>
        </div>
      )}

      {/* Time off tab */}
      {tab === 'timeoff' && (
        <div className="p-4 space-y-4">
          {staff.timeOff.length === 0 && !addingTimeOff ? (
            <p className="text-sm text-brand-muted italic">No time off recorded.</p>
          ) : (
            <div className="space-y-2">
              {staff.timeOff.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-brand-border bg-white">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-dark">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {t.reason && <p className="text-xs text-brand-muted">{t.reason}</p>}
                  </div>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Full Day Off</span>
                  <button onClick={() => removeTimeOff(t.id)} className="p-1 rounded hover:bg-red-50 text-brand-muted hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {addingTimeOff ? (
            <div className="rounded-lg border border-brand-border p-3 space-y-3">
              <p className="text-xs font-semibold text-brand-dark">Add Time Off</p>
              {toErr && <p className="text-xs text-red-600">{toErr}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-muted mb-1">Date *</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
                </div>
                <div>
                  <label className="block text-xs text-brand-muted mb-1">Reason (optional)</label>
                  <input type="text" value={toReason} onChange={e => setToReason(e.target.value)}
                    placeholder="Annual leave, sick, holiday…"
                    className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setAddingTimeOff(false); setToErr(null) }}>Cancel</Button>
                <Button size="sm" loading={savingTimeOff} onClick={addTimeOff}><Save className="w-3.5 h-3.5" /> Save</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingTimeOff(true)}
              className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add Time Off
            </button>
          )}
        </div>
      )}

      {/* Visits this week tab */}
      {tab === 'visits' && (
        <div className="p-4">
          {weekVisits.length === 0 ? (
            <p className="text-sm text-brand-muted italic">No visits scheduled this week.</p>
          ) : (
            <div className="space-y-2">
              {weekVisits.map(v => {
                const dt    = new Date(v.scheduledAt)
                const label = VISIT_STATUS_LABELS[v.status] ?? v.status
                const color = VISIT_STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-600'
                return (
                  <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-white hover:bg-brand-surface/40 transition-colors">
                    <div className="text-xs text-brand-muted w-24 shrink-0 font-medium">
                      {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      <br />
                      {dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/patients/${v.patient.id}`} className="text-sm font-medium text-brand-dark hover:text-brand-blue truncate block">
                        {v.patient.firstName} {v.patient.lastName}
                      </Link>
                      <p className="text-xs text-brand-muted truncate">
                        {SERVICE_CODE_LABELS[v.serviceCode ?? ''] ?? v.serviceCode ?? 'General Visit'}
                      </p>
                    </div>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${color}`}>{label}</span>
                    <Link href={`/visits/${v.id}`} className="text-xs text-brand-blue hover:underline shrink-0">View</Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Schedule Visit Modal ─────────────────────────────────────────────────────

interface PatientOption { id: string; firstName: string; lastName: string; mrn: string }

function ScheduleVisitModal({ providers, nurses, onClose, onCreated }: {
  providers: StaffData[]
  nurses:    StaffData[]
  onClose:   () => void
  onCreated: (visit: VisitData) => void
}) {
  const [patients,    setPatients]    = useState<PatientOption[]>([])
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [form, setForm] = useState({
    patientId:   '',
    providerId:  '',
    nurseId:     '',
    serviceCode: '',
    date:        isoDate(new Date()),
    time:        '09:00',
    durationMin: '60',
    notes:       '',
  })

  useEffect(() => {
    fetch(`/api/patients?orgId=${DEFAULT_ORG_ID}&limit=300&isActive=true`)
      .then(r => r.json())
      .then(d => setPatients((d.data ?? []) as PatientOption[]))
      .catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString()
      const res = await fetch('/api/visits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId:       DEFAULT_ORG_ID,
          patientId:   form.patientId,
          providerId:  form.providerId  || undefined,
          nurseId:     form.nurseId     || undefined,
          scheduledAt,
          durationMin: parseInt(form.durationMin) || 60,
          notes:       form.notes       || undefined,
          tasks:       form.serviceCode ? [{ serviceCode: form.serviceCode }] : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : 'Failed to schedule visit')
      onCreated({
        id:          data.data.id,
        scheduledAt: data.data.scheduledAt,
        status:      data.data.status,
        serviceCode: form.serviceCode || null,
        nurseId:     form.nurseId     || null,
        providerId:  form.providerId  || null,
        patient:     data.data.patient,
      })
      onClose()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border sticky top-0 bg-white">
          <h2 className="font-bold text-brand-dark flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-brand-red" /> Schedule Visit
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Patient *</label>
            <select value={form.patientId} onChange={e => set('patientId', e.target.value)} required className={inputCls}>
              <option value="">Select patient…</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} · {p.mrn}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
              <select value={form.providerId} onChange={e => set('providerId', e.target.value)} className={inputCls}>
                <option value="">Not assigned</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nurse</label>
              <select value={form.nurseId} onChange={e => set('nurseId', e.target.value)} className={inputCls}>
                <option value="">Not assigned</option>
                {nurses.map(n => <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service</label>
            <select value={form.serviceCode} onChange={e => set('serviceCode', e.target.value)} className={inputCls}>
              <option value="">No service selected</option>
              {Object.entries(SERVICE_CODE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time *</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
              <input type="number" value={form.durationMin} onChange={e => set('durationMin', e.target.value)} min={5} max={480} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className={`${inputCls} resize-none`} placeholder="Any instructions or notes…" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button size="sm" loading={submitting} type="submit">
              <CalendarPlus className="w-3.5 h-3.5" /> Schedule Visit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SchedulingClient({ initialProviders, initialNurses, visits }: {
  initialProviders: StaffData[]
  initialNurses:    StaffData[]
  visits:           VisitData[]
}) {
  const [weekStart,    setWeekStart]    = useState<Date>(getThisMonday)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [providers,    setProviders]    = useState<StaffData[]>(initialProviders)
  const [nurses,       setNurses]       = useState<StaffData[]>(initialNurses)
  const [showSchedule, setShowSchedule] = useState(false)
  const [filterFrom,   setFilterFrom]   = useState(() => isoDate(getThisMonday()))
  const [filterTo,     setFilterTo]     = useState(() => isoDate(addDays(getThisMonday(), 6)))
  const [allVisits,    setAllVisits]    = useState<VisitData[]>(visits)

  function getMondayOf(d: Date): Date {
    const r   = new Date(d)
    const day = r.getDay()
    r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
    r.setHours(0, 0, 0, 0)
    return r
  }

  function handleFromChange(val: string) {
    setFilterFrom(val)
    if (val) setWeekStart(getMondayOf(new Date(val + 'T00:00:00')))
  }

  function handleToChange(val: string) {
    setFilterTo(val)
  }

  const allStaff   = useMemo(() => [...providers, ...nurses], [providers, nurses])
  const filteredVisits = useMemo(() => {
    if (!filterFrom && !filterTo) return allVisits
    return allVisits.filter(v => {
      const d = v.scheduledAt.substring(0, 10)
      if (filterFrom && d < filterFrom) return false
      if (filterTo   && d > filterTo)   return false
      return true
    })
  }, [allVisits, filterFrom, filterTo])
  const weekDays   = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const selectedStaff = allStaff.find(s => s.id === selectedId) ?? null
  const today      = isoDate(new Date())

  // Palette: providers get first half, nurses get second half (by index)
  const paletteFor = (staffId: string) => {
    const idx = allStaff.findIndex(s => s.id === staffId)
    return STAFF_PALETTE[idx % STAFF_PALETTE.length]
  }

  const hasTimeOff = (staff: StaffData, date: Date): boolean =>
    staff.timeOff.some(t => t.date === isoDate(date))

  const updateStaff = (id: string, patch: Partial<StaffData>) => {
    setProviders(p => p.map(s => s.id === id ? { ...s, ...patch } : s))
    setNurses(p    => p.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const prevWeek = () => {
    const s = addDays(weekStart, -7)
    setWeekStart(s); setFilterFrom(isoDate(s)); setFilterTo(isoDate(addDays(s, 6)))
  }
  const nextWeek = () => {
    const s = addDays(weekStart, 7)
    setWeekStart(s); setFilterFrom(isoDate(s)); setFilterTo(isoDate(addDays(s, 6)))
  }
  const goToday = () => {
    const s = getThisMonday()
    setWeekStart(s); setFilterFrom(isoDate(s)); setFilterTo(isoDate(addDays(s, 6)))
  }

  const renderGrid = (group: StaffData[], groupLabel: string) => (
    <>
      <tr>
        <td colSpan={8} className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-widest">{groupLabel}</p>
        </td>
      </tr>
      {group.length === 0 && (
        <tr>
          <td colSpan={8} className="px-4 py-3 text-xs text-brand-muted italic">No {groupLabel.toLowerCase()} added yet.</td>
        </tr>
      )}
      {group.map(staff => {
        const pal      = paletteFor(staff.id)
        const selected = selectedId === staff.id
        return (
          <tr key={staff.id}
            onClick={() => setSelectedId(selected ? null : staff.id)}
            className={cn(
              'cursor-pointer transition-colors border-t border-brand-border/40',
              selected ? 'bg-brand-surface' : 'hover:bg-brand-surface/50'
            )}>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pal.dot}`} />
                <div>
                  <p className="text-sm font-medium text-brand-dark leading-tight">
                    {staff.firstName} {staff.lastName}
                  </p>
                  {(staff.firstNameNepali || staff.lastNameNepali) && (
                    <p className="text-[10px] text-brand-muted leading-tight">
                      {[staff.firstNameNepali, staff.lastNameNepali].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </td>
            {weekDays.map(day => {
              const slot      = staff.availability.find(a => a.dayOfWeek === day.getDay())
              const timeOff   = hasTimeOff(staff, day)
              const dayVisits = allVisits.filter(v =>
                (v.nurseId === staff.id || v.providerId === staff.id) &&
                v.scheduledAt.substring(0, 10) === isoDate(day)
              )
              const isToday   = isoDate(day) === today
              return (
                <td key={day.toISOString()} className={cn('px-2 py-2 align-top', isToday && 'bg-brand-red/5')}>
                  <AvailCell slot={slot} onTimeOff={timeOff} dayVisits={dayVisits} palette={pal} />
                </td>
              )
            })}
          </tr>
        )
      })}
    </>
  )

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Scheduling</h1>
          <p className="text-sm text-brand-muted mt-0.5">Provider and nurse availability by week</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range filter */}
          <div className="flex items-center gap-2 bg-white border border-brand-border rounded-lg px-3 py-1.5">
            <span className="text-xs text-brand-muted font-medium">From</span>
            <input type="date" value={filterFrom} onChange={e => handleFromChange(e.target.value)}
              className="h-7 text-sm border-0 focus:outline-none focus:ring-0 text-brand-dark" />
            <span className="text-xs text-brand-muted font-medium">To</span>
            <input type="date" value={filterTo} onChange={e => handleToChange(e.target.value)}
              className="h-7 text-sm border-0 focus:outline-none focus:ring-0 text-brand-dark" />
          </div>
          {/* Week navigation */}
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-border hover:bg-brand-surface transition-colors">
            Today
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-brand-border overflow-hidden">
            <button onClick={prevWeek} className="px-2.5 py-1.5 hover:bg-brand-surface transition-colors">
              <ChevronLeft className="w-4 h-4 text-brand-muted" />
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-brand-dark whitespace-nowrap min-w-[200px] text-center">
              {fmtWeekRange(weekStart)}
            </span>
            <button onClick={nextWeek} className="px-2.5 py-1.5 hover:bg-brand-surface transition-colors">
              <ChevronRight className="w-4 h-4 text-brand-muted" />
            </button>
          </div>
          {/* Schedule Visit */}
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors"
          >
            <CalendarPlus className="w-4 h-4" /> Schedule Visit
          </button>
        </div>
      </div>

      {/* Main view: Scheduled Visits on top, Calendar grid below */}
      <Card padding="none">

        {/* Visits summary bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-brand-surface/60 border-b border-brand-border">
          <p className="text-xs font-semibold text-brand-dark uppercase tracking-widest">Staff Schedule</p>
          <span className="text-xs text-brand-muted">
            {filteredVisits.length} visit{filteredVisits.length !== 1 ? 's' : ''} · {filterFrom} → {filterTo}
          </span>
        </div>

        {/* Staff detail panel — inside card, above grid */}
        {selectedStaff && (
          <div className="border-b border-brand-border">
            <StaffPanel
              key={selectedStaff.id}
              staff={selectedStaff}
              visits={allVisits}
              weekStart={weekStart}
              onClose={() => setSelectedId(null)}
              onAvailChange={updated => updateStaff(selectedStaff.id, { availability: updated })}
              onTimeOffChange={updated => updateStaff(selectedStaff.id, { timeOff: updated })}
            />
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-5 text-[11px] text-brand-muted px-4 py-2 border-b border-brand-border bg-brand-surface/40">
          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-green-600" /> Available (click row to manage)</span>
          <span className="flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-dark text-white text-[9px] font-bold">2</span> Visit count</span>
          <span className="flex items-center gap-1.5"><UserX className="w-3 h-3 text-red-500" /> Time off</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-red/10 border border-brand-red/20 inline-block" /> Today</span>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface border-b border-brand-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-xs text-brand-muted w-[200px]">Staff</th>
                {weekDays.map(day => {
                  const isToday = isoDate(day) === today
                  return (
                    <th key={day.toISOString()}
                      className={cn('px-2 py-3 text-center font-medium text-xs min-w-[110px]', isToday ? 'text-brand-red bg-brand-red/5' : 'text-brand-muted')}>
                      <p>{DAY_NAMES[day.getDay()]}</p>
                      <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-brand-red' : 'text-brand-dark'}`}>
                        {day.getDate()}
                      </p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {renderGrid(providers, 'Providers')}
              {renderGrid(nurses,    'Nurses')}
            </tbody>
          </table>
        </div>

        {allStaff.length === 0 && (
          <div className="text-center py-10 text-brand-muted">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">No providers or nurses added yet.</p>
            <Link href="/services" className="text-xs text-brand-blue hover:underline mt-1 inline-block">
              Add staff in Services → Providers / Nurses
            </Link>
          </div>
        )}

        {!selectedStaff && allStaff.length > 0 && (
          <div className="flex items-center justify-center py-4 text-brand-muted border-t border-brand-border">
            <p className="text-xs">Click any staff row above to view and edit their schedule.</p>
          </div>
        )}

      </Card>

      {/* Schedule Visit Modal */}
      {showSchedule && (
        <ScheduleVisitModal
          providers={providers}
          nurses={nurses}
          onClose={() => setShowSchedule(false)}
          onCreated={v => setAllVisits(prev => [...prev, v].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)))}
        />
      )}
    </div>
  )
}
