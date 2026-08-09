'use client'

import { useState, useMemo } from 'react'
import { FlaskConical, Plus, X, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react'

interface Patient { id: string; firstName: string; lastName: string; mrn: string }
interface LabResult {
  id: string
  testName: string
  result: string
  unit: string | null
  flag: string | null
  category: string | null
  panelDate: string
  notes: string | null
  patient: { firstName: string; lastName: string; mrn: string }
}

const FLAG_STYLES: Record<string, string> = {
  normal:   'bg-green-100 text-green-700',
  high:     'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700 font-bold',
  pending:  'bg-gray-100 text-gray-500',
}

const CATEGORIES = ['metabolic', 'blood_count', 'lipids', 'vitamins']
const FLAGS      = ['normal', 'low', 'high', 'critical']

const CATEGORY_LABELS: Record<string, string> = {
  metabolic:   'Metabolic',
  blood_count: 'Blood Count',
  lipids:      'Lipids',
  vitamins:    'Vitamins',
}

interface Form {
  patientId:    string
  panelDate:    string
  category:     string
  testName:     string
  result:       string
  unit:         string
  flag:         string
  referenceMin: string
  referenceMax: string
  notes:        string
}

const EMPTY_FORM: Form = {
  patientId: '', panelDate: new Date().toISOString().slice(0, 10),
  category: 'metabolic', testName: '', result: '', unit: '',
  flag: 'normal', referenceMin: '', referenceMax: '', notes: '',
}

export default function LabResultsClient({
  patients,
  initialResults,
}: {
  patients:       Patient[]
  initialResults: LabResult[]
}) {
  const [results, setResults]     = useState<LabResult[]>(initialResults)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState<Form>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [filterFlag, setFilterFlag] = useState('')

  const filtered = useMemo(() => {
    return results.filter(r => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        r.testName.toLowerCase().includes(q) ||
        r.patient.firstName.toLowerCase().includes(q) ||
        r.patient.lastName.toLowerCase().includes(q) ||
        r.patient.mrn.toLowerCase().includes(q)
      const matchesFlag = !filterFlag || r.flag === filterFlag
      return matchesSearch && matchesFlag
    })
  }, [results, search, filterFlag])

  function set(field: keyof Form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.patientId || !form.testName || !form.result) {
      setError('Patient, test name and result are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/lab/results', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          patientId:    form.patientId,
          panelDate:    form.panelDate,
          category:     form.category || null,
          testName:     form.testName,
          result:       form.result,
          unit:         form.unit || null,
          flag:         form.flag || 'normal',
          referenceMin: form.referenceMin ? Number(form.referenceMin) : null,
          referenceMax: form.referenceMax ? Number(form.referenceMax) : null,
          notes:        form.notes || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const created = await res.json()
      const patient = patients.find(p => p.id === form.patientId)!
      setResults(prev => [{
        id: created.id, testName: form.testName, result: form.result,
        unit: form.unit || null, flag: form.flag || 'normal', category: form.category || null,
        panelDate: form.panelDate, notes: form.notes || null,
        patient: { firstName: patient.firstName, lastName: patient.lastName, mrn: patient.mrn },
      }, ...prev])
      setForm({ ...EMPTY_FORM, patientId: form.patientId, panelDate: form.panelDate })
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Lab Results</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Result'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-emerald-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">New Lab Result</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Patient *</label>
              <select
                value={form.patientId}
                onChange={e => set('patientId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select patient…</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Panel Date *</label>
              <input
                type="date"
                value={form.panelDate}
                onChange={e => set('panelDate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Test Name *</label>
              <input
                type="text"
                value={form.testName}
                onChange={e => set('testName', e.target.value)}
                placeholder="e.g. Fasting Blood Glucose, HbA1c"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Result *</label>
              <input
                type="text"
                value={form.result}
                onChange={e => set('result', e.target.value)}
                placeholder="e.g. 6.8"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                placeholder="e.g. mmol/L, g/dL, %"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Flag</label>
              <select
                value={form.flag}
                onChange={e => set('flag', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {FLAGS.map(f => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reference Min</label>
              <input
                type="number"
                step="0.01"
                value={form.referenceMin}
                onChange={e => set('referenceMin', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reference Max</label>
              <input
                type="number"
                step="0.01"
                value={form.referenceMax}
                onChange={e => set('referenceMax', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Result
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or test…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterFlag}
          onChange={e => setFilterFlag(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All flags</option>
          {FLAGS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
        </select>
      </div>

      {/* Results list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No results found</p>
          </div>
        )}
        {filtered.map(r => {
          const expanded = expandedId === r.id
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expanded ? null : r.id)}
              >
                <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${FLAG_STYLES[r.flag ?? 'pending'] ?? 'bg-gray-100 text-gray-500'}`}>
                  {(r.flag ?? 'pending').toUpperCase()}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.testName}</p>
                  <p className="text-xs text-gray-400">
                    {r.patient.firstName} {r.patient.lastName} · {r.patient.mrn} · {r.panelDate}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {r.result}{r.unit ? <span className="text-xs text-gray-400 ml-0.5">{r.unit}</span> : null}
                  </span>
                  {expanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-1.5 text-xs text-gray-600">
                  {r.category && (
                    <div className="flex gap-2">
                      <span className="w-28 text-gray-400">Category</span>
                      <span>{CATEGORY_LABELS[r.category] ?? r.category}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="w-28 text-gray-400">Panel Date</span>
                    <span>{r.panelDate}</span>
                  </div>
                  {r.unit && (
                    <div className="flex gap-2">
                      <span className="w-28 text-gray-400">Unit</span>
                      <span>{r.unit}</span>
                    </div>
                  )}
                  {r.notes && (
                    <div className="flex gap-2">
                      <span className="w-28 text-gray-400">Notes</span>
                      <span className="italic">{r.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-center text-gray-400">{filtered.length} of {results.length} results</p>
    </div>
  )
}
