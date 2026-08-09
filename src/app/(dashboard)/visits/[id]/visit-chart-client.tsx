'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Circle, SkipForward, Brain, Activity, Footprints,
  Pill, Heart, ChevronDown, ChevronUp, ClipboardList, Plus
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VisitStatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  serviceCode: string
  label: string
  status: string
  notes: string
}

interface Medication {
  id: string
  name: string
  dose: string | null
  frequency: string | null
  status: string
  isActive: boolean
}

interface VitalsForm {
  bloodPressureSys: string
  bloodPressureDia: string
  heartRate: string
  temperature: string
  oxygenSaturation: string
  bloodGlucose: string
  painScore: string
  height: string
  weight: string
  notes: string
}

interface CGAData {
  id: string
  assessedAt: string | Date
  assessedBy: { firstName: string; lastName: string }
  mocaScore:      number | null
  gdsScore:       number | null
  camPositive:    boolean | null
  tugSeconds:     number | null
  fallsLast6m:    number | null
  adlScore:       number | null
  iadlScore:      number | null
  homeHazards:    number | null
  bpSystolic:     number | null
  bpDiastolic:    number | null
  orthoDropMmhg:  number | null
  bmi:            number | null
  primaryGoal:    string | null
  livingSituation: string | null
  advanceCarePlan: string | null
  mnaNutrition:   number | null
  visionNotes:    string | null
  hearingNotes:   string | null
  continenceNotes: string | null
  labScreeningItems: string[] | null
  notes:          string | null
}

interface CGAForm {
  assessedById:    string
  assessedAt:      string
  mocaScore:       string
  gdsScore:        string
  camPositive:     string
  tugSeconds:      string
  fallsLast6m:     string
  adlScore:        string
  iadlScore:       string
  homeHazards:     string
  orthoDropMmhg:   string
  primaryGoal:     string
  livingSituation: string
  advanceCarePlan: string
  mnaNutrition:    string
  visionNotes:     string
  hearingNotes:    string
  continenceNotes: string
  notes:           string
}

// ─── Clinical Lab Assessment checklist structure ──────────────────────────────

interface LabItem { id: string; label: string }
interface LabSubcategory { id: string; label: string | null; items: LabItem[] }
interface LabCategory { id: string; label: string; color: string; subcategories: LabSubcategory[] }

const LAB_CATEGORIES: LabCategory[] = [
  {
    id: 'routine_blood_labs', label: 'Routine Blood Labs', color: '🟥',
    subcategories: [
      {
        id: 'lipid_profile', label: 'Lipid Profile (Cardiovascular Health)',
        items: [
          { id: 'total_cholesterol', label: 'Total Cholesterol' },
          { id: 'hdl_cholesterol', label: 'HDL Cholesterol (Good cholesterol)' },
          { id: 'ldl_cholesterol', label: 'LDL Cholesterol (Bad cholesterol)' },
          { id: 'triglycerides', label: 'Triglycerides' },
        ],
      },
      {
        id: 'cbc', label: 'Complete Blood Count / CBC (Blood & Immunity)',
        items: [
          { id: 'rbc', label: 'Red Blood Cell Count (RBC)' },
          { id: 'wbc', label: 'White Blood Cell Count (WBC)' },
          { id: 'platelet_count', label: 'Platelet Count' },
          { id: 'hemoglobin', label: 'Hemoglobin' },
          { id: 'hematocrit', label: 'Hematocrit' },
        ],
      },
      {
        id: 'blood_sugar', label: 'Blood Sugar / Diabetes Screening',
        items: [
          { id: 'fasting_glucose', label: 'Fasting Blood Glucose' },
          { id: 'hba1c', label: 'HbA1c (3-month blood sugar average)' },
        ],
      },
      {
        id: 'thyroid_function', label: 'Thyroid Function',
        items: [
          { id: 'tsh', label: 'Thyroid-Stimulating Hormone (TSH)' },
        ],
      },
    ],
  },
  {
    id: 'cmp', label: 'Comprehensive Metabolic Panel / CMP (Organ Function)', color: '🟨',
    subcategories: [
      {
        id: 'kidney_function', label: 'Kidney Function & Electrolytes',
        items: [
          { id: 'sodium', label: 'Sodium' },
          { id: 'potassium', label: 'Potassium' },
          { id: 'chloride', label: 'Chloride' },
          { id: 'calcium', label: 'Calcium' },
          { id: 'bun', label: 'Blood Urea Nitrogen (BUN)' },
          { id: 'creatinine', label: 'Creatinine' },
          { id: 'egfr', label: 'eGFR (Estimated Glomerular Filtration Rate)' },
        ],
      },
      {
        id: 'liver_function', label: 'Liver Function & Proteins',
        items: [
          { id: 'alt', label: 'ALT (Alanine Aminotransferase)' },
          { id: 'ast', label: 'AST (Aspartate Aminotransferase)' },
          { id: 'total_bilirubin', label: 'Total Bilirubin' },
          { id: 'albumin', label: 'Albumin' },
          { id: 'total_protein', label: 'Total Protein' },
        ],
      },
    ],
  },
  {
    id: 'urine_cancer_screenings', label: 'Urine & Cancer Screenings', color: '🟩',
    subcategories: [
      {
        id: 'urinalysis', label: 'Urinalysis',
        items: [
          { id: 'urine_protein', label: 'Urine Protein' },
          { id: 'urine_glucose', label: 'Urine Glucose' },
          { id: 'urine_microscopic', label: 'Urine Microscopic Exam (Blood, cells, bacteria)' },
        ],
      },
      {
        id: 'age_based_cancer_screening', label: 'Age-Based Cancer Screening',
        items: [
          { id: 'colorectal_screening', label: 'Colorectal Cancer Screening (Colonoscopy or stool test)' },
          { id: 'low_dose_ct_lung', label: 'Low-Dose CT Lung Scan (Annual; for adults 50–80 with a heavy smoking history)' },
        ],
      },
    ],
  },
  {
    id: 'gender_specific_screenings', label: 'Gender-Specific Screenings', color: '🟪',
    subcategories: [
      {
        id: 'gender_specific_items', label: null,
        items: [
          { id: 'psa', label: 'Prostate-Specific Antigen / PSA (For biological men)' },
          { id: 'dexa_scan', label: 'Bone Mineral Density / DEXA Scan (For post-menopausal women or at-risk men)' },
        ],
      },
    ],
  },
  {
    id: 'common_optional_addons', label: 'Common Optional Add-ons', color: '🟦',
    subcategories: [
      {
        id: 'vitamins_inflammation', label: 'Vitamins & Inflammation Markers',
        items: [
          { id: 'vitamin_d', label: 'Vitamin D' },
          { id: 'vitamin_b12', label: 'Vitamin B12' },
          { id: 'hs_crp', label: 'High-Sensitivity C-Reactive Protein (hs-CRP)' },
        ],
      },
    ],
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_VITALS: VitalsForm = {
  bloodPressureSys: '', bloodPressureDia: '', heartRate: '',
  temperature: '', oxygenSaturation: '', bloodGlucose: '',
  painScore: '', height: '', weight: '', notes: '',
}

const STATUS_FLOW: Record<string, string> = {
  scheduled:   'en_route',
  en_route:    'checked_in',
  checked_in:  'in_progress',
  in_progress: 'completed',
}

// Formats an ISO datetime as a "YYYY-MM-DDTHH:mm" string in the browser's local
// timezone, for prefilling a <input type="datetime-local"> with its current value.
function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

const INPUT_CLS = 'w-full h-8 rounded-lg border border-brand-border bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30'
const TEXTAREA_CLS = 'w-full rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30'

// ─── CGA helpers ─────────────────────────────────────────────────────────────

function cgaToForm(cga: CGAData, defaultAssessedById: string): CGAForm {
  return {
    assessedById:    defaultAssessedById,
    assessedAt:      cga.assessedAt ? new Date(cga.assessedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    mocaScore:       cga.mocaScore      != null ? String(cga.mocaScore)      : '',
    gdsScore:        cga.gdsScore       != null ? String(cga.gdsScore)        : '',
    camPositive:     cga.camPositive    != null ? String(cga.camPositive)    : '',
    tugSeconds:      cga.tugSeconds     != null ? String(cga.tugSeconds)     : '',
    fallsLast6m:     cga.fallsLast6m    != null ? String(cga.fallsLast6m)    : '',
    adlScore:        cga.adlScore       != null ? String(cga.adlScore)        : '',
    iadlScore:       cga.iadlScore      != null ? String(cga.iadlScore)       : '',
    homeHazards:     cga.homeHazards    != null ? String(cga.homeHazards)    : '',
    orthoDropMmhg:   cga.orthoDropMmhg  != null ? String(cga.orthoDropMmhg)  : '',
    primaryGoal:     cga.primaryGoal    ?? '',
    livingSituation: cga.livingSituation ?? '',
    advanceCarePlan: cga.advanceCarePlan ?? '',
    mnaNutrition:    cga.mnaNutrition   != null ? String(cga.mnaNutrition)   : '',
    visionNotes:     cga.visionNotes    ?? '',
    hearingNotes:    cga.hearingNotes   ?? '',
    continenceNotes: cga.continenceNotes ?? '',
    notes:           cga.notes          ?? '',
  }
}

function emptyForm(defaultAssessedById: string): CGAForm {
  return {
    assessedById: defaultAssessedById,
    assessedAt:   new Date().toISOString().split('T')[0],
    mocaScore: '', gdsScore: '', camPositive: '',
    tugSeconds: '', fallsLast6m: '', adlScore: '', iadlScore: '', homeHazards: '',
    orthoDropMmhg: '',
    primaryGoal: '', livingSituation: '', advanceCarePlan: '',
    mnaNutrition: '', visionNotes: '', hearingNotes: '', continenceNotes: '', notes: '',
  }
}

function n(s: string) { return s.trim() === '' ? undefined : Number(s) }
function b(s: string) { return s.trim() === '' ? undefined : s === 'true' }

// ─── CGA section label ────────────────────────────────────────────────────────

function MsLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1 mb-2">
      <Icon className="w-4 h-4 text-brand-muted" />
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</span>
      <div className="flex-1 border-t border-brand-border/70" />
    </div>
  )
}

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Medications (add / discontinue) ──────────────────────────────────────────

function MedicationsPanel({ patientId, medications, onChange }: {
  patientId: string
  medications: Medication[]
  onChange: (meds: Medication[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', dose: '', frequency: '', status: 'active' })
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const active = medications.filter(m => m.isActive)
  const discontinued = medications.filter(m => !m.isActive)

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const addMedication = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/patients/${patientId}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const json = await res.json()
      onChange([json.data, ...medications])
      setForm({ name: '', dose: '', frequency: '', status: 'active' })
      setShowAdd(false)
    }
    setSaving(false)
  }

  const discontinue = async (medId: string) => {
    setUpdatingId(medId)
    const res = await fetch(`/api/patients/${patientId}/medications/${medId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false, status: 'discontinued' }),
    })
    if (res.ok) {
      const json = await res.json()
      onChange(medications.map(m => m.id === medId ? json.data : m))
    }
    setUpdatingId(null)
  }

  return (
    <div className="space-y-2">
      {active.map(m => (
        <div key={m.id} className="flex items-center justify-between gap-2 text-sm bg-white border border-brand-border rounded-lg px-3 py-2">
          <div>
            <span className="font-medium text-brand-dark">{m.name}</span>
            {m.dose && <span className="text-brand-muted"> · {m.dose}</span>}
            {m.frequency && <span className="text-brand-muted"> · {m.frequency}</span>}
          </div>
          <button
            type="button" onClick={() => discontinue(m.id)} disabled={updatingId === m.id}
            className="text-xs text-red-600 hover:underline disabled:opacity-50 shrink-0"
          >
            {updatingId === m.id ? 'Updating…' : 'Discontinue'}
          </button>
        </div>
      ))}
      {active.length === 0 && !showAdd && (
        <p className="text-xs text-brand-muted">No active medications recorded.</p>
      )}
      {discontinued.length > 0 && (
        <details className="text-xs text-brand-muted">
          <summary className="cursor-pointer select-none">Discontinued ({discontinued.length})</summary>
          <ul className="mt-1 space-y-1">
            {discontinued.map(m => (
              <li key={m.id} className="line-through">{m.name}{m.dose ? ` · ${m.dose}` : ''}</li>
            ))}
          </ul>
        </details>
      )}

      {showAdd ? (
        <div className="border border-brand-border rounded-lg p-3 space-y-2 bg-brand-surface">
          <div className="grid grid-cols-3 gap-2">
            <input value={form.name} onChange={f('name')} placeholder="Medication name" className="h-8 rounded border border-brand-border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
            <input value={form.dose} onChange={f('dose')} placeholder="Dose" className="h-8 rounded border border-brand-border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
            <input value={form.frequency} onChange={f('frequency')} placeholder="Frequency" className="h-8 rounded border border-brand-border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={addMedication}>Save Medication</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add medication
        </button>
      )}
    </div>
  )
}

// ─── CGA Read-only display ────────────────────────────────────────────────────

function CGADisplay({ cga, patientId, medications, onMedicationsChange }: {
  cga: CGAData
  patientId: string
  medications: Medication[]
  onMedicationsChange: (meds: Medication[]) => void
}) {
  function score(val: number | null, max: number, lowBound: number, midBound: number) {
    if (val == null) return '—'
    const color = val <= lowBound ? 'text-red-600' : val <= midBound ? 'text-yellow-600' : 'text-green-700'
    return <span className={`font-medium ${color}`}>{val}/{max}</span>
  }

  const tugColor = cga.tugSeconds == null ? '' : cga.tugSeconds > 20 ? 'text-red-600' : cga.tugSeconds > 12 ? 'text-yellow-600' : 'text-green-700'

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-brand-muted">
          Assessment by <span className="text-brand-dark font-medium">{cga.assessedBy.firstName} {cga.assessedBy.lastName}</span>
          {' '}on {formatDate(cga.assessedAt)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Mind */}
        <div>
          <MsLabel icon={Brain} label="Mind" />
          <dl className="space-y-1.5">
            <DRow label="MoCA"     value={score(cga.mocaScore, 30, 17, 24)} hint={cga.mocaScore != null ? (cga.mocaScore < 18 ? 'impaired' : cga.mocaScore < 25 ? 'MCI' : 'normal') : undefined} />
            <DRow label="GDS"      value={score(cga.gdsScore, 15, 9, 4)} hint={cga.gdsScore != null ? (cga.gdsScore > 9 ? 'severe' : cga.gdsScore > 4 ? 'moderate' : 'normal') : undefined} />
            <DRow label="Delirium" value={cga.camPositive == null ? '—' : cga.camPositive ? <span className="text-red-600 font-medium">CAM positive</span> : <span className="text-green-700">CAM negative</span>} />
          </dl>
        </div>

        {/* Body */}
        <div>
          <MsLabel icon={Activity} label="Body" />
          <dl className="space-y-1.5">
            <DRow label="BP"          value={cga.bpSystolic ? `${cga.bpSystolic}/${cga.bpDiastolic} mmHg` : '—'} />
            <DRow label="Ortho drop"  value={cga.orthoDropMmhg != null ? `${cga.orthoDropMmhg} mmHg` : '—'} />
            <DRow label="BMI"         value={cga.bmi != null ? String(cga.bmi) : '—'} />
            <DRow label="MNA"         value={cga.mnaNutrition != null ? `${cga.mnaNutrition}/14` : '—'} />
          </dl>
        </div>

        {/* Mobility */}
        <div>
          <MsLabel icon={Footprints} label="Mobility" />
          <dl className="space-y-1.5">
            <DRow label="TUG"    value={cga.tugSeconds != null ? <span className={tugColor}>{cga.tugSeconds}s</span> : '—'} hint={cga.tugSeconds != null ? (cga.tugSeconds > 20 ? 'high risk' : cga.tugSeconds > 12 ? 'moderate' : 'normal') : undefined} />
            <DRow label="Falls"  value={cga.fallsLast6m != null ? `${cga.fallsLast6m} in 6 mo` : '—'} />
            <DRow label="ADL"    value={cga.adlScore    != null ? `${cga.adlScore}/6`  : '—'} />
            <DRow label="IADL"   value={cga.iadlScore   != null ? `${cga.iadlScore}/8` : '—'} />
            <DRow label="Hazards" value={cga.homeHazards != null ? `${cga.homeHazards} home hazards` : '—'} />
          </dl>
        </div>
      </div>

      {/* Medications */}
      <div>
        <MsLabel icon={Pill} label="Medications" />
        <MedicationsPanel patientId={patientId} medications={medications} onChange={onMedicationsChange} />
      </div>

      {/* Matters Most */}
      <div>
        <MsLabel icon={Heart} label="Matters Most" />
        <dl className="space-y-1.5">
          <DRow label="Goal"   value={cga.primaryGoal     ?? '—'} />
          <DRow label="Living" value={cga.livingSituation ?? '—'} />
          <DRow label="ACP"    value={cga.advanceCarePlan?.replace('_', ' ') ?? '—'} capitalize />
        </dl>
      </div>

      {/* Other screens */}
      {(cga.visionNotes || cga.hearingNotes || cga.continenceNotes) && (
        <div className="grid grid-cols-3 gap-3 text-xs text-brand-muted border-t border-brand-border pt-3">
          {cga.visionNotes     && <div><span className="font-medium text-brand-dark">Vision: </span>{cga.visionNotes}</div>}
          {cga.hearingNotes    && <div><span className="font-medium text-brand-dark">Hearing: </span>{cga.hearingNotes}</div>}
          {cga.continenceNotes && <div><span className="font-medium text-brand-dark">Continence: </span>{cga.continenceNotes}</div>}
        </div>
      )}

      {cga.notes && (
        <div className="rounded-lg bg-brand-surface px-3 py-2 text-xs text-brand-muted border border-brand-border">
          <span className="font-medium text-brand-dark">Notes: </span>{cga.notes}
        </div>
      )}
    </div>
  )
}

function DRow({ label, value, hint, capitalize }: { label: string; value: React.ReactNode; hint?: string; capitalize?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-brand-muted text-xs">{label}</dt>
      <dd className={`text-xs font-medium text-brand-dark ${capitalize ? 'capitalize' : ''}`}>
        {value}
        {hint && <span className="ml-1 font-normal text-brand-muted">({hint})</span>}
      </dd>
    </div>
  )
}

// ─── CGA edit form ────────────────────────────────────────────────────────────

function CGAFormSection({
  visitId, form, setForm, users, existingCgaId, onSaved, patientId, medications, onMedicationsChange,
  bpSystolic, bpDiastolic, bmi,
}: {
  visitId: string
  form: CGAForm
  setForm: React.Dispatch<React.SetStateAction<CGAForm>>
  users: { id: string; firstName: string; lastName: string }[]
  existingCgaId?: string
  onSaved: (cga: CGAData) => void
  patientId: string
  medications: Medication[]
  onMedicationsChange: (meds: Medication[]) => void
  bpSystolic: string
  bpDiastolic: string
  bmi: string | null
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const f = (k: keyof CGAForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    setError(null)
    const payload = {
      assessedById:    form.assessedById,
      assessedAt:      form.assessedAt,
      mocaScore:       n(form.mocaScore),
      gdsScore:        n(form.gdsScore),
      camPositive:     b(form.camPositive),
      tugSeconds:      n(form.tugSeconds),
      fallsLast6m:     n(form.fallsLast6m),
      adlScore:        n(form.adlScore),
      iadlScore:       n(form.iadlScore),
      homeHazards:     n(form.homeHazards),
      bpSystolic:      n(bpSystolic),
      bpDiastolic:     n(bpDiastolic),
      orthoDropMmhg:   n(form.orthoDropMmhg),
      bmi:             bmi ? Number(bmi) : undefined,
      primaryGoal:     form.primaryGoal     || undefined,
      livingSituation: form.livingSituation || undefined,
      advanceCarePlan: form.advanceCarePlan || undefined,
      mnaNutrition:    n(form.mnaNutrition),
      visionNotes:     form.visionNotes     || undefined,
      hearingNotes:    form.hearingNotes    || undefined,
      continenceNotes: form.continenceNotes || undefined,
      notes:           form.notes           || undefined,
    }

    const method  = existingCgaId ? 'PUT'  : 'POST'
    const body    = existingCgaId ? { cgaId: existingCgaId, ...payload } : payload
    const res = await fetch(`/api/visits/${visitId}/cga`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(JSON.stringify(json.error))
    } else {
      const json = await res.json()
      onSaved(json.data)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3">
        <FLabel label="Assessed By">
          <select value={form.assessedById} onChange={f('assessedById')} className={INPUT_CLS}>
            {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </FLabel>
        <FLabel label="Date">
          <input type="date" value={form.assessedAt} onChange={f('assessedAt')} className={INPUT_CLS} />
        </FLabel>
      </div>

      {/* Mind */}
      <div>
        <MsLabel icon={Brain} label="Mind" />
        <div className="grid grid-cols-3 gap-3">
          <FLabel label="MoCA Score (0–30)">
            <input type="number" min={0} max={30} value={form.mocaScore} onChange={f('mocaScore')}
              className={INPUT_CLS} placeholder="e.g. 24" />
          </FLabel>
          <FLabel label="GDS Score (0–15)">
            <input type="number" min={0} max={15} value={form.gdsScore} onChange={f('gdsScore')}
              className={INPUT_CLS} placeholder="e.g. 6" />
          </FLabel>
          <FLabel label="CAM (Delirium)">
            <select value={form.camPositive} onChange={f('camPositive')} className={INPUT_CLS}>
              <option value="">Not assessed</option>
              <option value="false">Negative</option>
              <option value="true">Positive</option>
            </select>
          </FLabel>
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-3 text-xs text-brand-muted">
          <p>≥26 normal · 18–25 MCI · &lt;18 impaired</p>
          <p>0–4 normal · 5–9 moderate · ≥10 severe</p>
          <p></p>
        </div>
      </div>

      {/* Body */}
      <div>
        <MsLabel icon={Activity} label="Body (Multicomplexity)" />
        <div className="grid grid-cols-4 gap-3">
          <FLabel label="BP Sys (mmHg)">
            <div className="h-8 w-full rounded-lg border border-brand-border bg-brand-surface px-2.5 text-sm flex items-center text-brand-muted">{bpSystolic || '—'}</div>
          </FLabel>
          <FLabel label="BP Dia (mmHg)">
            <div className="h-8 w-full rounded-lg border border-brand-border bg-brand-surface px-2.5 text-sm flex items-center text-brand-muted">{bpDiastolic || '—'}</div>
          </FLabel>
          <FLabel label="Ortho Drop (mmHg)">
            <input type="number" value={form.orthoDropMmhg} onChange={f('orthoDropMmhg')} className={INPUT_CLS} placeholder="e.g. 14" />
          </FLabel>
          <FLabel label="BMI">
            <div className="h-8 w-full rounded-lg border border-brand-border bg-brand-surface px-2.5 text-sm flex items-center text-brand-muted">{bmi ?? '—'}</div>
          </FLabel>
          <FLabel label="MNA Nutrition (0–14)">
            <input type="number" min={0} max={14} value={form.mnaNutrition} onChange={f('mnaNutrition')} className={INPUT_CLS} placeholder="e.g. 10" />
          </FLabel>
        </div>
        <p className="mt-1.5 text-xs text-brand-muted">BP Sys, BP Dia, and BMI come from the Record Vitals form above.</p>
      </div>

      {/* Mobility */}
      <div>
        <MsLabel icon={Footprints} label="Mobility" />
        <div className="grid grid-cols-3 gap-3">
          <FLabel label="TUG (seconds)">
            <input type="number" step={0.1} min={0} value={form.tugSeconds} onChange={f('tugSeconds')} className={INPUT_CLS} placeholder="e.g. 18.2" />
          </FLabel>
          <FLabel label="Falls (last 6 months)">
            <input type="number" min={0} value={form.fallsLast6m} onChange={f('fallsLast6m')} className={INPUT_CLS} placeholder="e.g. 1" />
          </FLabel>
          <FLabel label="Home Hazards Count">
            <input type="number" min={0} value={form.homeHazards} onChange={f('homeHazards')} className={INPUT_CLS} placeholder="e.g. 3" />
          </FLabel>
          <FLabel label="ADL Score (0–6 Katz)">
            <input type="number" min={0} max={6} value={form.adlScore} onChange={f('adlScore')} className={INPUT_CLS} placeholder="e.g. 5" />
          </FLabel>
          <FLabel label="IADL Score (0–8 Lawton)">
            <input type="number" min={0} max={8} value={form.iadlScore} onChange={f('iadlScore')} className={INPUT_CLS} placeholder="e.g. 6" />
          </FLabel>
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-3 text-xs text-brand-muted">
          <p>TUG: &lt;12s normal · 12–20 moderate · &gt;20 high risk</p>
          <p></p>
          <p></p>
        </div>
      </div>

      {/* Medications */}
      <div>
        <MsLabel icon={Pill} label="Medications" />
        <MedicationsPanel patientId={patientId} medications={medications} onChange={onMedicationsChange} />
      </div>

      {/* Matters Most */}
      <div>
        <MsLabel icon={Heart} label="Matters Most" />
        <div className="grid grid-cols-2 gap-3">
          <FLabel label="Patient's Primary Goal">
            <input value={form.primaryGoal} onChange={f('primaryGoal')} className={INPUT_CLS} placeholder="What matters most to the patient?" />
          </FLabel>
          <FLabel label="Living Situation">
            <input value={form.livingSituation} onChange={f('livingSituation')} className={INPUT_CLS} placeholder="e.g. Lives alone, with spouse…" />
          </FLabel>
          <FLabel label="Advance Care Plan">
            <select value={form.advanceCarePlan} onChange={f('advanceCarePlan')} className={INPUT_CLS}>
              <option value="">Not discussed</option>
              <option value="documented">Documented</option>
              <option value="to_discuss">To Discuss</option>
              <option value="declined">Declined</option>
            </select>
          </FLabel>
        </div>
      </div>

      {/* Additional screens */}
      <div>
        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Additional Screens</p>
        <div className="grid grid-cols-3 gap-3">
          <FLabel label="Vision">
            <input value={form.visionNotes} onChange={f('visionNotes')} className={INPUT_CLS} placeholder="Issues, aids…" />
          </FLabel>
          <FLabel label="Hearing">
            <input value={form.hearingNotes} onChange={f('hearingNotes')} className={INPUT_CLS} placeholder="Issues, aids…" />
          </FLabel>
          <FLabel label="Continence">
            <input value={form.continenceNotes} onChange={f('continenceNotes')} className={INPUT_CLS} placeholder="Notes…" />
          </FLabel>
        </div>
      </div>

      {/* Overall notes */}
      <FLabel label="Overall Assessment Notes">
        <textarea value={form.notes} onChange={f('notes')} rows={3} className={TEXTAREA_CLS}
          placeholder="Clinical impressions, plan, follow-up…" />
      </FLabel>

      <div className="flex justify-end">
        <Button size="sm" loading={saving} onClick={save}>
          <ClipboardList className="w-3.5 h-3.5" />
          {existingCgaId ? 'Update Assessment' : 'Save Assessment'}
        </Button>
      </div>
    </div>
  )
}

// ─── Clinical Lab Assessment (standalone, separate from the CGA form) ─────────

function ClinicalLabAssessmentCard({ visitId, existingCga, defaultAssessedById, isEditable, onSaved }: {
  visitId: string
  existingCga: CGAData | null
  defaultAssessedById: string
  isEditable: boolean
  onSaved: (cga: CGAData) => void
}) {
  const [items, setItems] = useState<string[]>(existingCga?.labScreeningItems ?? [])
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(['urine_cancer_screenings', 'gender_specific_screenings', 'common_optional_addons'])
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCollapse = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const toggleItem = (itemId: string) => {
    setItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId])
  }

  const toggleCategory = (cat: LabCategory) => {
    const ids = cat.subcategories.flatMap(s => s.items.map(i => i.id))
    const allChecked = ids.every(id => items.includes(id))
    setItems(prev => allChecked ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    const method = existingCga?.id ? 'PUT' : 'POST'
    const body = existingCga?.id
      ? { cgaId: existingCga.id, labScreeningItems: items }
      : { assessedById: defaultAssessedById, assessedAt: new Date().toISOString().split('T')[0], labScreeningItems: items }
    const res = await fetch(`/api/visits/${visitId}/cga`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      setError('Failed to save lab assessment')
    } else {
      const json = await res.json()
      onSaved(json.data)
    }
    setSaving(false)
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-brand-muted" />
        <h3>Clinical Lab Assessment</h3>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="space-y-4">
        {LAB_CATEGORIES.map(cat => {
          const catIds = cat.subcategories.flatMap(s => s.items.map(i => i.id))
          const allChecked = catIds.every(id => items.includes(id))
          const collapsed = collapsedCategories.has(cat.id)
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  disabled={!isEditable}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-brand-border"
                />
                <button
                  type="button"
                  onClick={() => toggleCollapse(cat.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark"
                >
                  {cat.color} {cat.label}
                  {collapsed ? <ChevronDown className="w-4 h-4 text-brand-muted" /> : <ChevronUp className="w-4 h-4 text-brand-muted" />}
                </button>
                <span className="text-xs text-brand-muted font-normal">(Select all)</span>
              </div>
              {!collapsed && (
                <div className="space-y-3 pl-4">
                  {cat.subcategories.map(sub => (
                    <div key={sub.id}>
                      {sub.label && <p className="text-xs font-medium text-brand-muted mb-1.5">{sub.label}</p>}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {sub.items.map(item => (
                          <label key={item.id} className="flex items-start gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={items.includes(item.id)}
                              disabled={!isEditable}
                              onChange={() => toggleItem(item.id)}
                              className="mt-0.5 rounded border-brand-border"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isEditable && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="secondary" loading={saving} onClick={save}>
            Save Lab Assessment
          </Button>
        </div>
      )}
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VisitChartClient({
  visitId, initialStatus, scheduledAt, durationMin, nurseId, nurses, tasks: initialTasks,
  nurseNotes: initialNurseNotes, providerNotes: initialProviderNotes,
  isEditable, defaultAssessedById, users, existingCGA, patientId, medications: initialMedications,
}: {
  visitId: string
  initialStatus: string
  scheduledAt: string
  durationMin: number
  nurseId: string | null
  nurses: { id: string; firstName: string; lastName: string }[]
  tasks: Task[]
  nurseNotes: string
  providerNotes: string
  isEditable: boolean
  defaultAssessedById: string
  users: { id: string; firstName: string; lastName: string }[]
  existingCGA: CGAData | null
  patientId: string
  medications: Medication[]
}) {
  const router = useRouter()
  const [status, setStatus]             = useState(initialStatus)
  const [tasks, setTasks]               = useState(initialTasks)
  const [nurseNotes, setNurseNotes]     = useState(initialNurseNotes)
  const [providerNotes, setProviderNotes] = useState(initialProviderNotes)
  const [medications, setMedications]   = useState(initialMedications ?? [])
  const [vitals, setVitals]             = useState<VitalsForm>(EMPTY_VITALS)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingVitals, setSavingVitals] = useState(false)
  const [savingComplete, setSavingComplete] = useState(false)
  const [vitalsError, setVitalsError]   = useState<string | null>(null)

  // Confirm & Schedule (for requests submitted via the family portal)
  const [confirmForm, setConfirmForm] = useState({
    scheduledAt: toLocalDatetimeInput(scheduledAt),
    durationMin: String(durationMin),
    nurseId:     nurseId ?? '',
  })
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const confirmSchedule = async () => {
    if (!confirmForm.scheduledAt || !confirmForm.nurseId) {
      setConfirmError('Please choose a date/time and assign a nurse.')
      return
    }
    setConfirming(true)
    setConfirmError(null)
    const res = await fetch(`/api/visits/${visitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status:      'scheduled',
        scheduledAt: new Date(confirmForm.scheduledAt).toISOString(),
        durationMin: Number(confirmForm.durationMin) || 60,
        nurseId:     confirmForm.nurseId,
      }),
    })
    if (!res.ok) {
      setConfirmError('Failed to confirm visit. Please try again.')
      setConfirming(false)
      return
    }
    setStatus('scheduled')
    setConfirming(false)
    router.refresh()
  }

  // CGA state
  const [cga, setCGA]           = useState<CGAData | null>(existingCGA)
  const [cgaOpen, setCGAOpen]   = useState(!!existingCGA)
  const [cgaEditMode, setCGAEditMode] = useState(!existingCGA)
  const [cgaForm, setCGAForm]   = useState<CGAForm>(() =>
    existingCGA
      ? cgaToForm(existingCGA, defaultAssessedById)
      : emptyForm(defaultAssessedById)
  )

  const nextStatus = STATUS_FLOW[status]

  const advanceStatus = async () => {
    if (!nextStatus) return
    setSavingStatus(true)
    await fetch(`/api/visits/${visitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, ...(nextStatus === 'checked_in' ? { checkedInAt: new Date().toISOString() } : {}) }),
    })
    setStatus(nextStatus)
    setSavingStatus(false)
  }

  const saveVitals = async () => {
    setSavingVitals(true)
    setVitalsError(null)
    const num = (s: string) => s.trim() === '' ? undefined : Number(s)
    const res = await fetch(`/api/visits/${visitId}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bloodPressureSys: num(vitals.bloodPressureSys),
        bloodPressureDia: num(vitals.bloodPressureDia),
        heartRate:        num(vitals.heartRate),
        temperature:      num(vitals.temperature),
        oxygenSaturation: num(vitals.oxygenSaturation),
        bloodGlucose:     num(vitals.bloodGlucose),
        painScore:        num(vitals.painScore),
        height:           num(vitals.height),
        weight:           num(vitals.weight),
        notes:            vitals.notes || undefined,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const fieldErrors = body?.error?.fieldErrors as Record<string, string[]> | undefined
      const detail = fieldErrors
        ? Object.entries(fieldErrors).filter(([, msgs]) => msgs.length).map(([field, msgs]) => `${field}: ${msgs[0]}`).join('; ')
        : body?.error
      setVitalsError(detail ? `Failed to save vitals — ${detail}` : 'Failed to save vitals')
    } else {
      router.refresh()
    }
    setSavingVitals(false)
  }

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
        : t
    ))
  }

  const completeVisit = async () => {
    setSavingComplete(true)
    await fetch(`/api/visits/${visitId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nurseNotes,
        providerNotes,
        taskUpdates: tasks.map(t => ({ taskId: t.id, status: t.status, notes: t.notes })),
      }),
    })
    setSavingComplete(false)
    setStatus('completed')
    router.refresh()
  }

  const handleCGASaved = (saved: CGAData) => {
    setCGA(saved)
    setCGAEditMode(false)
  }

  const v = vitals
  const setV = (k: keyof VitalsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setVitals(prev => ({ ...prev, [k]: e.target.value }))

  const heightM = Number(v.height) / 100
  const weightKg = Number(v.weight)
  const bmi = heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null

  const renderVitalField = ([label, key, min, max, step]: [string, keyof VitalsForm, number, number, number | undefined]) => (
    <div key={key}>
      <label className="text-xs text-brand-muted block mb-1">{label}</label>
      <input
        value={v[key]} onChange={setV(key)} type="number"
        min={min} max={max} step={step}
        className="h-8 w-full rounded border border-brand-border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Confirm & Schedule — for visits requested via the family portal, not yet confirmed */}
      {status === 'requested' && (
        <Card className="border-pink-200 bg-pink-50/40">
          <h3 className="mb-3 flex items-center gap-2">
            <VisitStatusBadge status={status} />
            Confirm this visit request
          </h3>
          {confirmError && <p className="text-xs text-red-600 mb-3">{confirmError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-brand-muted block mb-1">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={confirmForm.scheduledAt}
                onChange={e => setConfirmForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full h-8 rounded-lg border border-brand-border bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30"
              />
            </div>
            <div>
              <label className="text-xs text-brand-muted block mb-1">Duration (min)</label>
              <input
                type="number" min={5} max={480}
                value={confirmForm.durationMin}
                onChange={e => setConfirmForm(f => ({ ...f, durationMin: e.target.value }))}
                className="w-full h-8 rounded-lg border border-brand-border bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-brand-muted block mb-1">Assign Nurse</label>
              <select
                value={confirmForm.nurseId}
                onChange={e => setConfirmForm(f => ({ ...f, nurseId: e.target.value }))}
                className="w-full h-8 rounded-lg border border-brand-border bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30"
              >
                <option value="">Select a nurse…</option>
                {nurses.map(n => (
                  <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <Button size="sm" loading={confirming} onClick={confirmSchedule}>
            Confirm &amp; Schedule
          </Button>
        </Card>
      )}

      {/* Status bar */}
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VisitStatusBadge status={status} />
          {nextStatus && (
            <span className="text-xs text-brand-muted">Next: {nextStatus.replace(/_/g, ' ')}</span>
          )}
        </div>
        {isEditable && nextStatus && status !== 'in_progress' && (
          <Button size="sm" variant="secondary" loading={savingStatus} onClick={advanceStatus}>
            Mark {nextStatus.replace(/_/g, ' ')}
          </Button>
        )}
      </Card>

      {/* Services / Tasks */}
      <Card padding="none">
        <CardHeader><h3>Services</h3></CardHeader>
        <CardBody className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-brand-muted">No services scheduled for this visit.</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="flex items-start gap-3">
                <button
                  type="button"
                  disabled={!isEditable}
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 shrink-0 text-brand-muted disabled:cursor-default"
                >
                  {task.status === 'completed'
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : task.status === 'skipped'
                    ? <SkipForward  className="w-5 h-5 text-gray-400" />
                    : <Circle       className="w-5 h-5" />
                  }
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${task.status === 'completed' ? 'line-through text-brand-muted' : 'text-brand-dark'}`}>
                    {task.label}
                  </p>
                  {isEditable && (
                    <input
                      value={task.notes}
                      onChange={e => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notes: e.target.value } : t))}
                      placeholder="Task notes…"
                      className="mt-1 h-7 w-full text-xs rounded border border-brand-border px-2 focus:outline-none focus:ring-1 focus:ring-brand-red/30"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Vitals entry */}
      {isEditable && (
        <Card>
          <h3 className="mb-4">Record Vitals</h3>
          {vitalsError && <p className="text-xs text-red-600 mb-3">{vitalsError}</p>}
          <div className="grid grid-cols-3 gap-3 text-sm">
            {([
              ['BP Sys (mmHg)',    'bloodPressureSys', 60,   300, undefined],
              ['BP Dia (mmHg)',    'bloodPressureDia', 30,   200, undefined],
              ['Heart Rate (bpm)', 'heartRate',        20,   300, undefined],
            ] as [string, keyof VitalsForm, number, number, number | undefined][]).map(renderVitalField)}
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mt-3">
            {([
              ['Body Temp (°C)', 'temperature',      30, 45,  0.1],
              ['SpO₂ (%)',       'oxygenSaturation', 50, 100, undefined],
            ] as [string, keyof VitalsForm, number, number, number | undefined][]).map(renderVitalField)}
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mt-3">
            {([
              ['Height (cm)', 'height', 30, 250, 0.1],
              ['Weight (kg)', 'weight', 1,  500, 0.1],
            ] as [string, keyof VitalsForm, number, number, number | undefined][]).map(renderVitalField)}
            <div>
              <label className="text-xs text-brand-muted block mb-1">BMI</label>
              <div className="h-8 w-full rounded border border-brand-border px-2 flex items-center text-brand-muted bg-gray-50">
                {bmi ?? '—'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mt-3">
            {([
              ['Blood Glucose (mg/dL)', 'bloodGlucose', 10, 800, undefined],
              ['Pain Score (0–10)',     'painScore',    0,  10,  undefined],
            ] as [string, keyof VitalsForm, number, number, number | undefined][]).map(renderVitalField)}
          </div>
          <div className="mt-3">
            <label className="text-xs text-brand-muted block mb-1">Vitals Notes</label>
            <textarea value={v.notes} onChange={setV('notes')} rows={2}
              className="w-full rounded border border-brand-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30"
              placeholder="Any additional observations…" />
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="secondary" loading={savingVitals} onClick={saveVitals}>
              Save Vitals
            </Button>
          </div>
        </Card>
      )}

      {/* ── CGA Assessment ────────────────────────────────────────────────── */}
      <Card padding="none">
        <button
          type="button"
          onClick={() => setCGAOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-surface/60 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-muted" />
            <h3>Comprehensive Geriatric Assessment (5Ms)</h3>
            {cga && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                Completed {formatDate(cga.assessedAt)}
              </span>
            )}
            {!cga && isEditable && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                Not yet completed
              </span>
            )}
          </div>
          {cgaOpen ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
        </button>

        {cgaOpen && (
          <CardBody className="border-t border-brand-border">
            {/* If we have saved CGA and not in edit mode, show display */}
            {cga && !cgaEditMode && (
              <div>
                <CGADisplay cga={cga} patientId={patientId} medications={medications} onMedicationsChange={setMedications} />
                {isEditable && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm" variant="secondary"
                      onClick={() => {
                        setCGAForm(cgaToForm(cga, defaultAssessedById))
                        setCGAEditMode(true)
                      }}
                    >
                      Edit Assessment
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Edit / new form */}
            {(cgaEditMode || !cga) && isEditable && (
              <CGAFormSection
                visitId={visitId}
                form={cgaForm}
                setForm={setCGAForm}
                users={users}
                existingCgaId={cga?.id}
                onSaved={handleCGASaved}
                patientId={patientId}
                medications={medications}
                onMedicationsChange={setMedications}
                bpSystolic={v.bloodPressureSys}
                bpDiastolic={v.bloodPressureDia}
                bmi={bmi}
              />
            )}

            {/* If not editable and no CGA */}
            {!cga && !isEditable && (
              <p className="text-sm text-brand-muted">No geriatric assessment was recorded for this visit.</p>
            )}
          </CardBody>
        )}
      </Card>

      {/* Clinical Lab Assessment — separate from the CGA form above */}
      <ClinicalLabAssessmentCard
        visitId={visitId}
        existingCga={cga}
        defaultAssessedById={defaultAssessedById}
        isEditable={isEditable}
        onSaved={setCGA}
      />

      {/* Clinical notes */}
      {(isEditable || nurseNotes || providerNotes) && (
        <Card>
          <h3 className="mb-4">Clinical Notes</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-brand-dark block mb-1">Nurse Notes</label>
              <textarea
                value={nurseNotes}
                onChange={e => setNurseNotes(e.target.value)}
                disabled={!isEditable}
                rows={3}
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:bg-brand-surface"
                placeholder="Observations, patient condition, interventions…"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-dark block mb-1">Provider Notes</label>
              <textarea
                value={providerNotes}
                onChange={e => setProviderNotes(e.target.value)}
                disabled={!isEditable}
                rows={3}
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:bg-brand-surface"
                placeholder="Clinical assessment, plan, orders…"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Complete visit */}
      {isEditable && status === 'in_progress' && (
        <div className="flex justify-end">
          <Button loading={savingComplete} onClick={completeVisit}>
            <CheckCircle2 className="w-4 h-4" />
            Complete Visit
          </Button>
        </div>
      )}
    </div>
  )
}
