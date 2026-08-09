'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Pencil, X, Save, Search, FlaskConical, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { SERVICE_CODE_LABELS } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientOption { id: string; firstName: string; lastName: string }

export interface VisitOption {
  id: string; patientId: string; scheduledAt: string
  serviceCode: string | null; status: string
}

export interface LabResultData {
  id: string; patientId: string; visitId: string | null
  panelDate: string; category: string | null
  testName: string; result: string; unit: string | null
  referenceMin: string | null; referenceMax: string | null
  flag: string | null; notes: string | null; createdAt: string
  patient: PatientOption
  visit: { id: string; scheduledAt: string; serviceCode: string | null } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  normal:   { label: 'Normal',   color: 'bg-green-50 text-green-700',   icon: CheckCircle2 },
  high:     { label: 'High',     color: 'bg-yellow-50 text-yellow-700', icon: TrendingUp },
  low:      { label: 'Low',      color: 'bg-blue-50 text-blue-700',     icon: TrendingDown },
  critical: { label: 'Critical', color: 'bg-red-50 text-red-700',       icon: AlertTriangle },
  pending:  { label: 'Pending',  color: 'bg-gray-100 text-gray-500',    icon: Minus },
}

const CATEGORIES = [
  { value: '',            label: '— All Categories —' },
  { value: 'metabolic',   label: 'Metabolic Panel' },
  { value: 'blood_count', label: 'Blood Count (CBC)' },
  { value: 'lipids',      label: 'Lipid Panel' },
  { value: 'thyroid',     label: 'Thyroid (TSH/T3/T4)' },
  { value: 'vitamins',    label: 'Vitamins & Minerals' },
  { value: 'urine',       label: 'Urine Analysis' },
  { value: 'other',       label: 'Other' },
]

const FLAG_OPTIONS = ['', 'normal', 'high', 'low', 'critical']

// ─── Shared inputs ────────────────────────────────────────────────────────────

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <input {...props} className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
    </div>
  )
}

function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <select {...props} className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-red/30">
        {children}
      </select>
    </div>
  )
}

function TextAreaField({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <textarea {...props} className="w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30 resize-none" />
    </div>
  )
}

// ─── Lab Result Form ──────────────────────────────────────────────────────────

interface LabFormState {
  patientId: string; visitId: string
  panelDate: string; category: string
  testName: string; result: string; unit: string
  referenceMin: string; referenceMax: string; flag: string; notes: string
}

function initForm(result?: LabResultData, today = ''): LabFormState {
  if (!result) return { patientId: '', visitId: '', panelDate: today, category: '', testName: '', result: '', unit: '', referenceMin: '', referenceMax: '', flag: '', notes: '' }
  return {
    patientId:    result.patientId,
    visitId:      result.visitId ?? '',
    panelDate:    result.panelDate.substring(0, 10),
    category:     result.category ?? '',
    testName:     result.testName,
    result:       result.result,
    unit:         result.unit ?? '',
    referenceMin: result.referenceMin ?? '',
    referenceMax: result.referenceMax ?? '',
    flag:         result.flag ?? '',
    notes:        result.notes ?? '',
  }
}

function LabForm({ result, patients, visits, onSave, onCancel }: {
  result?: LabResultData
  patients: PatientOption[]
  visits: VisitOption[]
  onSave: (data: Partial<LabFormState>) => Promise<void>
  onCancel: () => void
}) {
  const isNew  = !result
  const today  = new Date().toISOString().substring(0, 10)
  const [form, setForm] = useState<LabFormState>(initForm(result, today))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const f = (k: keyof LabFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const patientVisits = visits.filter(v => v.patientId === form.patientId)

  const save = async () => {
    if (isNew && !form.patientId)    { setError('Select a patient'); return }
    if (!form.panelDate)             { setError('Panel date is required'); return }
    if (!form.testName.trim())       { setError('Test name is required'); return }
    if (!form.result.trim())         { setError('Result value is required'); return }
    setSaving(true); setError(null)
    try {
      await onSave({
        patientId:    form.patientId  || undefined,
        visitId:      form.visitId    || undefined,
        panelDate:    form.panelDate,
        category:     form.category   || undefined,
        testName:     form.testName.trim(),
        result:       form.result.trim(),
        unit:         form.unit.trim()         || undefined,
        referenceMin: form.referenceMin.trim() || undefined,
        referenceMax: form.referenceMax.trim() || undefined,
        flag:         form.flag                || undefined,
        notes:        form.notes.trim()        || undefined,
      })
    } catch (e: unknown) { setError((e as Error).message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-xl border border-brand-red/20 bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{isNew ? 'Enter Lab Result' : `Edit: ${result?.testName}`}</h4>
        <button onClick={onCancel} className="text-brand-muted hover:text-brand-dark"><X className="w-4 h-4" /></button>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {isNew && (
          <SelectField label="Patient *" value={form.patientId} onChange={f('patientId')}>
            <option value="">— Select patient —</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
          </SelectField>
        )}
        <SelectField label="Linked Visit (optional)" value={form.visitId} onChange={f('visitId')}>
          <option value="">— No visit link —</option>
          {(isNew ? patientVisits : visits.filter(v => v.patientId === (result?.patientId ?? form.patientId))).map(v => (
            <option key={v.id} value={v.id}>
              {formatDate(v.scheduledAt)} · {SERVICE_CODE_LABELS[v.serviceCode ?? ''] ?? v.serviceCode ?? 'Visit'} · {v.status}
            </option>
          ))}
        </SelectField>
        <InputField label="Panel Date *" type="date" value={form.panelDate} onChange={f('panelDate')} />
        <SelectField label="Category" value={form.category} onChange={f('category')}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </SelectField>
        <div className="col-span-2">
          <InputField label="Test Name *" value={form.testName} onChange={f('testName')} placeholder="e.g. Fasting Blood Glucose, HbA1c, Creatinine" />
        </div>
        <InputField label="Result *" value={form.result} onChange={f('result')} placeholder="e.g. 7.2 or Positive" />
        <InputField label="Unit" value={form.unit} onChange={f('unit')} placeholder="e.g. mmol/L, mg/dL, %" />
        <InputField label="Reference Min" value={form.referenceMin} onChange={f('referenceMin')} placeholder="e.g. 3.9" />
        <InputField label="Reference Max" value={form.referenceMax} onChange={f('referenceMax')} placeholder="e.g. 5.6" />
        <SelectField label="Flag" value={form.flag} onChange={f('flag')}>
          {FLAG_OPTIONS.map(v => <option key={v} value={v}>{v ? FLAG_CFG[v]?.label : '— Not flagged —'}</option>)}
        </SelectField>
      </div>
      <TextAreaField label="Notes" value={form.notes} onChange={f('notes')} rows={2} placeholder="Interpretation, follow-up instructions, etc." />
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}><Save className="w-3.5 h-3.5" /> {isNew ? 'Save Result' : 'Save Changes'}</Button>
      </div>
    </div>
  )
}

// ─── Result row with inline edit ──────────────────────────────────────────────

function ResultRow({ r, patients, visits, onUpdate }: {
  r: LabResultData
  patients: PatientOption[]
  visits: VisitOption[]
  onUpdate: (id: string, updated: LabResultData) => void
}) {
  const [editing, setEditing] = useState(false)
  const cfg  = r.flag ? FLAG_CFG[r.flag] : FLAG_CFG.pending
  const Icon = cfg.icon

  const save = async (data: Partial<LabFormState>) => {
    const res = await fetch(`/api/lab/results/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')
    const updated = {
      ...r, ...json.data,
      panelDate: json.data.panelDate ?? r.panelDate,
      visit: json.data.visit ?? r.visit,
    }
    onUpdate(r.id, updated)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-brand-surface/50">
        <td colSpan={8} className="px-4 py-3">
          <LabForm result={r} patients={patients} visits={visits} onSave={save} onCancel={() => setEditing(false)} />
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-brand-surface/40 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/patients/${r.patient.id}`} className="font-medium text-brand-blue hover:underline text-sm">
          {r.patient.firstName} {r.patient.lastName}
        </Link>
        {r.visit && (
          <p className="text-[11px] text-brand-muted mt-0.5">
            Visit: {formatDate(r.visit.scheduledAt)} · {SERVICE_CODE_LABELS[r.visit.serviceCode ?? ''] ?? 'General'}
          </p>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-brand-muted whitespace-nowrap">{formatDate(r.panelDate)}</td>
      <td className="px-3 py-3">
        <p className="text-sm font-medium text-brand-dark">{r.testName}</p>
        {r.category && <p className="text-[11px] text-brand-muted">{CATEGORIES.find(c => c.value === r.category)?.label ?? r.category}</p>}
      </td>
      <td className="px-3 py-3">
        <span className="text-sm font-semibold text-brand-dark">{r.result}</span>
        {r.unit && <span className="text-xs text-brand-muted ml-1">{r.unit}</span>}
      </td>
      <td className="px-3 py-3 text-xs text-brand-muted">
        {r.referenceMin || r.referenceMax
          ? `${r.referenceMin ?? ''}–${r.referenceMax ?? ''}`
          : '—'}
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </td>
      <td className="px-3 py-3 text-xs text-brand-muted max-w-[160px] truncate" title={r.notes ?? undefined}>{r.notes ?? '—'}</td>
      <td className="px-4 py-3">
        <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-brand-surface text-brand-muted hover:text-brand-dark transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface Filters { search: string; dateFrom: string; dateTo: string; flag: string; category: string }

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...filters, [k]: e.target.value })
  const dirty = filters.search || filters.dateFrom || filters.dateTo || filters.flag || filters.category
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
        <input type="text" placeholder="Patient name or test name" value={filters.search} onChange={set('search')}
          className="w-full h-8 rounded-lg border border-brand-border pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-brand-muted">From</label>
        <input type="date" value={filters.dateFrom} onChange={set('dateFrom')} className="h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-brand-muted">To</label>
        <input type="date" value={filters.dateTo} onChange={set('dateTo')} className="h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
      </div>
      <select value={filters.flag} onChange={set('flag')} className="h-8 rounded-lg border border-brand-border px-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-red/30">
        <option value="">All Flags</option>
        {Object.entries(FLAG_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
      </select>
      <select value={filters.category} onChange={set('category')} className="h-8 rounded-lg border border-brand-border px-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-red/30">
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label || 'All Categories'}</option>)}
      </select>
      {dirty && (
        <button onClick={() => onChange({ search: '', dateFrom: '', dateTo: '', flag: '', category: '' })}
          className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-dark">
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LabClient({ patients, visits, initialResults }: {
  patients:       PatientOption[]
  visits:         VisitOption[]
  initialResults: LabResultData[]
}) {
  const [results, setResults]   = useState<LabResultData[]>(initialResults)
  const [showAdd, setShowAdd]   = useState(false)
  const [filters, setFilters]   = useState<Filters>({ search: '', dateFrom: '', dateTo: '', flag: '', category: '' })

  const filtered = useMemo(() => results.filter(r => {
    const date = r.panelDate.substring(0, 10)
    if (filters.dateFrom && date < filters.dateFrom) return false
    if (filters.dateTo   && date > filters.dateTo)   return false
    if (filters.flag     && r.flag !== filters.flag)  return false
    if (filters.category && r.category !== filters.category) return false
    if (filters.search) {
      const q    = filters.search.toLowerCase()
      const name = `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase()
      if (!name.includes(q) && !r.testName.toLowerCase().includes(q)) return false
    }
    return true
  }), [results, filters])

  const createResult = async (data: Partial<LabFormState>) => {
    const res = await fetch('/api/lab/results', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to save')
    const lr    = json.data
    const pt    = patients.find(p => p.id === lr.patientId)
    const vs    = visits.find(v => v.id === lr.visitId) ?? null
    const entry: LabResultData = {
      id: lr.id, patientId: lr.patientId, visitId: lr.visitId ?? null,
      panelDate: lr.panelDate, category: lr.category ?? null,
      testName: lr.testName, result: lr.result, unit: lr.unit ?? null,
      referenceMin: lr.referenceMin ?? null, referenceMax: lr.referenceMax ?? null,
      flag: lr.flag ?? null, notes: lr.notes ?? null, createdAt: lr.createdAt,
      patient: pt ?? { id: lr.patientId, firstName: '?', lastName: '?' },
      visit: vs ? { id: vs.id, scheduledAt: vs.scheduledAt, serviceCode: vs.serviceCode } : null,
    }
    setResults(p => [entry, ...p])
    setShowAdd(false)
  }

  const updateResult = (id: string, updated: LabResultData) =>
    setResults(p => p.map(r => r.id === id ? updated : r))

  const criticalCount = results.filter(r => r.flag === 'critical').length
  const pendingCount  = results.filter(r => !r.flag).length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1>Lab Results</h1>
          <p className="text-sm text-brand-muted mt-0.5">Patient laboratory results linked to visits</p>
        </div>
        <Button onClick={() => setShowAdd(v => !v)}>
          {showAdd ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Enter Result</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Results',    value: results.length,  color: 'text-brand-dark' },
          { label: 'Critical Flags',   value: criticalCount,   color: criticalCount > 0 ? 'text-red-600' : 'text-brand-dark' },
          { label: 'Pending Review',   value: pendingCount,    color: pendingCount  > 0 ? 'text-yellow-600' : 'text-brand-dark' },
          { label: 'Linked to Visits', value: results.filter(r => r.visitId).length, color: 'text-brand-dark' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-brand-border px-4 py-3">
            <p className="text-xs text-brand-muted">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <LabForm patients={patients} visits={visits} onSave={createResult} onCancel={() => setShowAdd(false)} />
      )}

      {/* Results table */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-brand-border">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-brand-muted">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">{results.length === 0 ? 'No lab results yet. Click "Enter Result" to add the first one.' : 'No results match the selected filters.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface border-b border-brand-border">
                <tr className="text-xs text-brand-muted">
                  <th className="text-left px-4 py-2.5 font-medium w-[22%]">Patient / Visit</th>
                  <th className="text-left px-3 py-2.5 font-medium whitespace-nowrap">Panel Date</th>
                  <th className="text-left px-3 py-2.5 font-medium">Test</th>
                  <th className="text-left px-3 py-2.5 font-medium">Result</th>
                  <th className="text-left px-3 py-2.5 font-medium">Reference</th>
                  <th className="text-left px-3 py-2.5 font-medium">Flag</th>
                  <th className="text-left px-3 py-2.5 font-medium">Notes</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filtered.map(r => (
                  <ResultRow key={r.id} r={r} patients={patients} visits={visits} onUpdate={updateResult} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
