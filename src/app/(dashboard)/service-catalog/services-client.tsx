'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X, Save, Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanData {
  id: string; code: string; name: string; nameNepali: string | null
  description: string | null; bestFor: string | null; features: string[]
  priceMinNpr: number; priceMaxNpr: number; visitsPerMonth: number
  isActive: boolean; sortOrder: number
}

export interface ServiceData {
  code: string; category: string; nameEn: string; nameNp: string | null
  descriptionEn: string; defaultDurationMin: number; basePriceNpr: number | null
  isSameDay: boolean; requiresNurse: boolean; requiresProvider: boolean
  requiresCaregiver: boolean; isActive: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-red-50 text-red-700 border-red-200',
  'bg-teal-50 text-teal-700 border-teal-200',
]
const KNOWN_COLORS: Record<string, string> = {
  care_connect:      'bg-blue-50 text-blue-700 border-blue-200',
  wellness_plus:     'bg-green-50 text-green-700 border-green-200',
  chronic_care:      'bg-purple-50 text-purple-700 border-purple-200',
  recovery_care:     'bg-orange-50 text-orange-700 border-orange-200',
  premium_companion: 'bg-red-50 text-red-700 border-red-200',
}
const planColor = (code: string, sortOrder: number) =>
  KNOWN_COLORS[code] ?? TIER_COLORS[sortOrder % TIER_COLORS.length]

const SVC_CATEGORY: Record<string, string> = {
  scheduled: 'Scheduled', on_demand: 'On-Demand',
}

// ─── Shared inputs ────────────────────────────────────────────────────────────

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <input {...props}
        className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
    </div>
  )
}

function TextAreaField({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <textarea {...props}
        className="w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30 resize-none" />
    </div>
  )
}

// ─── Plan Form ────────────────────────────────────────────────────────────────

interface PlanFormState {
  code: string; name: string; nameNepali: string; description: string
  bestFor: string; featuresText: string; priceMinNpr: string
  priceMaxNpr: string; visitsPerMonth: string; sortOrder: string; isActive: boolean
}

function initPlanForm(plan?: PlanData): PlanFormState {
  if (!plan) return {
    code: '', name: '', nameNepali: '', description: '', bestFor: '',
    featuresText: '', priceMinNpr: '', priceMaxNpr: '',
    visitsPerMonth: '0', sortOrder: '0', isActive: true,
  }
  return {
    code: plan.code, name: plan.name, nameNepali: plan.nameNepali ?? '',
    description: plan.description ?? '', bestFor: plan.bestFor ?? '',
    featuresText: plan.features.join('\n'), priceMinNpr: String(plan.priceMinNpr),
    priceMaxNpr: String(plan.priceMaxNpr), visitsPerMonth: String(plan.visitsPerMonth),
    sortOrder: String(plan.sortOrder), isActive: plan.isActive,
  }
}

function PlanForm({ plan, onSave, onCancel }: {
  plan?: PlanData
  onSave: (data: Omit<PlanData, 'id'>) => Promise<void>
  onCancel: () => void
}) {
  const isNew = !plan
  const [form, setForm] = useState<PlanFormState>(initPlanForm(plan))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const f = (k: keyof PlanFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    if (!form.name.trim() || !form.priceMinNpr || !form.priceMaxNpr) {
      setError('Name, min price and max price are required'); return
    }
    if (isNew && !form.code.trim()) { setError('Code is required'); return }
    setSaving(true); setError(null)
    try {
      await onSave({
        code:           form.code.trim().toLowerCase().replace(/\s+/g, '_'),
        name:           form.name.trim(),
        nameNepali:     form.nameNepali.trim()     || null,
        description:    form.description.trim()    || null,
        bestFor:        form.bestFor.trim()         || null,
        features:       form.featuresText.split('\n').map(s => s.trim()).filter(Boolean),
        priceMinNpr:    Number(form.priceMinNpr),
        priceMaxNpr:    Number(form.priceMaxNpr),
        visitsPerMonth: Number(form.visitsPerMonth) || 0,
        sortOrder:      Number(form.sortOrder)      || 0,
        isActive:       form.isActive,
      })
    } catch (e: unknown) { setError((e as Error).message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-xl border border-brand-red/20 bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{isNew ? 'New Subscription Plan' : `Edit: ${plan?.name}`}</h4>
        <button onClick={onCancel} className="text-brand-muted hover:text-brand-dark"><X className="w-4 h-4" /></button>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {isNew && (
          <div className="col-span-2">
            <InputField label="Code (unique slug)" value={form.code} onChange={f('code')} placeholder="lowercase_with_underscores" />
          </div>
        )}
        <InputField label="Plan Name *"          value={form.name}       onChange={f('name')}       placeholder="e.g. Basic Care" />
        <InputField label="Nepali Name"          value={form.nameNepali} onChange={f('nameNepali')} />
        <InputField label="Min Price (USD/mo) *" type="number" min={0}  value={form.priceMinNpr}    onChange={f('priceMinNpr')} />
        <InputField label="Max Price (USD/mo) *" type="number" min={0}  value={form.priceMaxNpr}    onChange={f('priceMaxNpr')} />
        <InputField label="Visits / Month (0 = unlimited)" type="number" min={0} value={form.visitsPerMonth} onChange={f('visitsPerMonth')} />
        <InputField label="Sort Order"           type="number" min={0}  value={form.sortOrder}       onChange={f('sortOrder')} />
      </div>
      <InputField label="Best For (tagline)" value={form.bestFor} onChange={f('bestFor')} placeholder="e.g. Seniors with stable chronic conditions" />
      <TextAreaField label="Description" value={form.description} onChange={f('description')} rows={2} />
      <TextAreaField label="Features (one per line)" value={form.featuresText} onChange={f('featuresText')} rows={5}
        placeholder={"Monthly vitals check\nMedication review\nFamily WhatsApp updates"} />
      <div className="flex items-center gap-3 pt-1">
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <input type="checkbox" checked={form.isActive}
            onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
          Active (visible to patients)
        </label>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>
          <Save className="w-3.5 h-3.5" /> {isNew ? 'Create Plan' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ─── Subscription Plans Section ───────────────────────────────────────────────

function PlansSection({ initialPlans }: { initialPlans: PlanData[] }) {
  const router = useRouter()
  const [plans,     setPlans]     = useState<PlanData[]>(initialPlans)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd,   setShowAdd]   = useState(false)

  const create = async (data: Omit<PlanData, 'id'>) => {
    const res  = await fetch('/api/billing/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to create')
    setPlans(p => [...p, json.data].sort((a, b) => a.sortOrder - b.sortOrder))
    setShowAdd(false); router.refresh()
  }

  const update = async (id: string, data: Partial<PlanData>) => {
    const res  = await fetch(`/api/billing/plans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')
    setPlans(p => p.map(x => x.id === id ? { ...x, ...json.data } : x))
    setEditingId(null); router.refresh()
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">Subscription Plans</h2>
          <p className="text-xs text-brand-muted mt-0.5">
            {plans.length} plan{plans.length !== 1 ? 's' : ''} · {plans.filter(p => p.isActive).length} active
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowAdd(true); setEditingId(null) }}>
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </Button>
      </div>

      {showAdd && <PlanForm onSave={create} onCancel={() => setShowAdd(false)} />}

      <div className="grid grid-cols-2 gap-3">
        {plans.map(plan =>
          editingId === plan.id ? (
            <div key={plan.id} className="col-span-2">
              <PlanForm plan={plan} onSave={data => update(plan.id, data)} onCancel={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={plan.id}
              className={`rounded-xl border p-4 ${plan.isActive ? 'border-brand-border bg-white' : 'border-brand-border/40 bg-brand-surface/60 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${planColor(plan.code, plan.sortOrder)}`}>{plan.name}</span>
                    {plan.nameNepali && <span className="text-xs text-brand-muted">{plan.nameNepali}</span>}
                    {!plan.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-bold text-brand-dark">{formatMoney(plan.priceMinNpr)}</span>
                    {plan.priceMinNpr !== plan.priceMaxNpr && <span className="text-brand-muted">– {formatMoney(plan.priceMaxNpr)}</span>}
                    <span className="text-xs text-brand-muted">/month</span>
                    {plan.visitsPerMonth > 0 && <span className="text-xs text-brand-muted ml-2">{plan.visitsPerMonth} visits</span>}
                  </div>
                  {plan.bestFor && <p className="text-xs text-brand-muted mb-2">Best for: {plan.bestFor}</p>}
                  {plan.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.features.map(feat => (
                        <span key={feat} className="text-[11px] bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded-full text-brand-muted">{feat}</span>
                      ))}
                    </div>
                  )}
                  <p className="font-mono text-[10px] text-brand-muted mt-2">{plan.code}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => update(plan.id, { isActive: !plan.isActive })}
                    className="p-1.5 rounded-lg hover:bg-brand-surface transition-colors text-xs font-medium"
                    title={plan.isActive ? 'Deactivate' : 'Activate'}>
                    {plan.isActive
                      ? <span className="text-green-600">Active</span>
                      : <span className="text-brand-muted">Inactive</span>}
                  </button>
                  <button onClick={() => { setEditingId(plan.id); setShowAdd(false) }}
                    className="p-1.5 rounded-lg hover:bg-brand-surface text-brand-muted hover:text-brand-dark transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
        {plans.length === 0 && !showAdd && (
          <div className="col-span-2 text-center py-10 text-brand-muted">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No subscription plans yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Service Edit Row ─────────────────────────────────────────────────────────

function ServiceEditRow({ service, onSave, onCancel }: {
  service: ServiceData
  onSave:  (data: Partial<ServiceData>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nameEn: service.nameEn, nameNp: service.nameNp ?? '',
    descriptionEn: service.descriptionEn,
    defaultDurationMin: String(service.defaultDurationMin),
    basePriceNpr: service.basePriceNpr != null ? String(service.basePriceNpr) : '',
    isActive: service.isActive, requiresNurse: service.requiresNurse,
    requiresProvider: service.requiresProvider,
  })
  const [saving, setSaving] = useState(false)

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      await onSave({
        nameEn: form.nameEn.trim(), nameNp: form.nameNp.trim() || null,
        descriptionEn: form.descriptionEn.trim(),
        defaultDurationMin: Number(form.defaultDurationMin) || 60,
        basePriceNpr: form.basePriceNpr !== '' ? Number(form.basePriceNpr) : null,
        isActive: form.isActive, requiresNurse: form.requiresNurse, requiresProvider: form.requiresProvider,
      })
    } finally { setSaving(false) }
  }

  return (
    <tr className="bg-brand-surface/60">
      <td colSpan={6} className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="English Name"         value={form.nameEn} onChange={f('nameEn')} />
          <InputField label="Nepali Name"          value={form.nameNp} onChange={f('nameNp')} />
          <InputField label="Price (USD per visit)" type="number" min={0} value={form.basePriceNpr} onChange={f('basePriceNpr')} placeholder="Leave blank to quote separately" />
          <InputField label="Duration (minutes)"   type="number" min={15} value={form.defaultDurationMin} onChange={f('defaultDurationMin')} />
          <div className="col-span-2">
            <TextAreaField label="Description" value={form.descriptionEn} onChange={f('descriptionEn')} rows={2} />
          </div>
          <div className="col-span-2 flex items-center gap-4 flex-wrap">
            {([
              ['isActive',         'Active'],
              ['requiresNurse',    'Requires Nurse'],
              ['requiresProvider', 'Requires Doctor'],
            ] as [keyof typeof form, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input type="checkbox" checked={Boolean(form[key])}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
            <Button size="sm" loading={saving} onClick={save}><Save className="w-3.5 h-3.5" /> Save</Button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Service Catalog Section ──────────────────────────────────────────────────

function CatalogSection({ initialServices }: { initialServices: ServiceData[] }) {
  const router = useRouter()
  const [services,     setServices]     = useState<ServiceData[]>(initialServices)
  const [editingCode,  setEditingCode]  = useState<string | null>(null)
  const [filter,       setFilter]       = useState<'all' | 'scheduled' | 'on_demand'>('all')

  const update = async (code: string, data: Partial<ServiceData>) => {
    const res  = await fetch(`/api/services/${code}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')
    const updated = { ...json.data, basePriceNpr: json.data.basePriceNpr != null ? Number(json.data.basePriceNpr) : null }
    setServices(p => p.map(s => s.code === code ? { ...s, ...updated } : s))
    setEditingCode(null); router.refresh()
  }

  const visible = services.filter(s => filter === 'all' || s.category === filter)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-dark">On-Demand Services</h2>
          <p className="text-xs text-brand-muted mt-0.5">
            {services.length} services · {services.filter(s => s.basePriceNpr != null).length} with price set
          </p>
        </div>
        <div className="flex gap-1">
          {(['all', 'scheduled', 'on_demand'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                filter === f ? 'bg-brand-dark text-white' : 'text-brand-muted hover:bg-brand-surface'
              }`}>
              {f === 'all' ? 'All' : SVC_CATEGORY[f]}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-brand-border">
            <tr className="text-xs text-brand-muted">
              <th className="text-left px-4 py-2.5 font-medium w-[35%]">Service</th>
              <th className="text-left px-3 py-2.5 font-medium">Type</th>
              <th className="text-right px-3 py-2.5 font-medium">Price</th>
              <th className="text-right px-3 py-2.5 font-medium">Duration</th>
              <th className="text-center px-3 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {visible.map(s =>
              editingCode === s.code ? (
                <ServiceEditRow key={s.code} service={s}
                  onSave={data => update(s.code, data)}
                  onCancel={() => setEditingCode(null)} />
              ) : (
                <tr key={s.code} className={`hover:bg-brand-surface/40 transition-colors ${!s.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-dark">{s.nameEn}</p>
                    {s.nameNp && <p className="text-xs text-brand-muted">{s.nameNp}</p>}
                    <p className="font-mono text-[10px] text-brand-muted mt-0.5">{s.code}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.category === 'on_demand' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {SVC_CATEGORY[s.category] ?? s.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {s.basePriceNpr != null
                      ? <span className="font-semibold text-brand-dark">{formatMoney(s.basePriceNpr)}</span>
                      : <span className="text-xs text-brand-muted italic">Not set</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-brand-muted">{s.defaultDurationMin} min</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditingCode(s.code)}
                      className="p-1 rounded hover:bg-brand-surface text-brand-muted hover:text-brand-dark transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Card>
    </section>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesClient({ initialPlans, initialServices }: {
  initialPlans:    PlanData[]
  initialServices: ServiceData[]
}) {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1>Services</h1>
        <p className="text-sm text-brand-muted mt-0.5">Subscription plans and on-demand service catalog</p>
      </div>
      <PlansSection   initialPlans={initialPlans} />
      <CatalogSection initialServices={initialServices} />
    </div>
  )
}
