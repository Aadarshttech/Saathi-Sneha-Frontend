'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Brain, Activity, Footprints, Pill, Heart, AlertTriangle,
  Plus, ChevronRight, Phone, Shield, MapPin, Users, Calendar,
  FlaskConical, Syringe, Send, ClipboardList, CheckCircle2, Receipt,
  CreditCard, TrendingUp
} from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge, VisitStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime, calculateAge, fullName, formatMoney } from '@/lib/utils'
import { INSURANCE_SCHEMES } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'medications' | 'labs' | 'vaccinations' | 'referrals' | 'cga' | 'visits' | 'billing'

interface Diagnosis { id: string; icdCode: string; description: string; isPrimary: boolean; resolvedAt: Date | null }
interface FamilyMember { id: string; fullName: string; relationship: string; phone: string | null; country: string | null; isPrimaryContact: boolean }
interface VisitSummary { id: string; visitType: string | null; scheduledAt: Date; status: string; nurse: { firstName: string; lastName: string } | null; tasks: { id: string; serviceCode: string | null; status: string }[] }
interface Medication { id: string; name: string; dose: string | null; frequency: string | null; indication: string | null; prescriber: string | null; status: string; isBeersFlagged: boolean; beersNote: string | null; isActive: boolean }
interface LabResult { id: string; panelDate: Date; category: string | null; testName: string; result: string; unit: string | null; referenceMin: string | null; referenceMax: string | null; flag: string | null; trend: string | null; priorResult: string | null }
interface Vaccination { id: string; vaccineName: string; givenDate: Date | null; nextDueDate: Date | null; status: string }
interface Referral { id: string; specialty: string; reason: string; provider: string | null; referralDate: Date; appointmentDate: Date | null; status: string }
interface Alert { id: string; severity: string; title: string; description: string | null }
interface CarePlanGoal { id: string; goal: string; detail: string | null; status: string }
interface SubscriptionPlan {
  id: string; code: string; name: string
  priceMinNpr: number; priceMaxNpr: number
  visitsPerMonth: number; features: string[]
}

interface PatientSubscription {
  id: string; status: string; priceNpr: number
  startDate: string; renewalDate: string | null
  payerType: string; payerName: string | null; payerPhone: string | null
  plan: SubscriptionPlan
}

interface InvoiceLineItem { id: string; description: string; category: string; qty: number; unitPriceNpr: number; totalNpr: number }
interface InvoicePayment  { id: string; amountNpr: number; method: string; payerType: string; payerName: string | null; paidAt: string }

interface PatientInvoice {
  id: string; invoiceNo: string; invoiceDate: string; dueDate: string; status: string
  totalNpr: number; paidNpr: number; payerType: string
  lineItems: InvoiceLineItem[]; payments: InvoicePayment[]
}

interface CGAAssessment {
  id: string; assessedAt: Date
  visitId: string | null
  assessedBy: { firstName: string; lastName: string }
  mocaScore: number | null; gdsScore: number | null; camPositive: boolean | null
  tugSeconds: number | null; fallsLast6m: number | null; adlScore: number | null; iadlScore: number | null; homeHazards: number | null
  bpSystolic: number | null; bpDiastolic: number | null; orthoDropMmhg: number | null; bmi: number | null
  primaryGoal: string | null; livingSituation: string | null; advanceCarePlan: string | null
  mnaNutrition: number | null
}

interface PatientData {
  id: string; mrn: string; firstName: string; lastName: string
  firstNameNepali: string | null; lastNameNepali: string | null
  dateOfBirth: Date; gender: string; phone: string | null; altPhone: string | null
  email: string | null; bloodGroup: string | null
  province: string | null; district: string | null; municipality: string | null
  streetAddress: string | null; wardNo: number | null
  allergies: string[]; chronicConditions: string[]
  primaryLanguage: string
  insuranceScheme: string; insurancePolicyNo: string | null
  emergencyContactName: string | null; emergencyContactPhone: string | null; emergencyContactRelation: string | null
  branch: { id: string; name: string } | null
  primaryNurse: { id: string; firstName: string; lastName: string; phone: string | null } | null
  primaryDoctor: { id: string; firstName: string; lastName: string; phone: string | null } | null
  diagnoses: Diagnosis[]
  familyMembers: FamilyMember[]
  visits: VisitSummary[]
  medications: Medication[]
  labResults: LabResult[]
  vaccinations: Vaccination[]
  referrals: Referral[]
  alerts: Alert[]
  carePlanGoals: CarePlanGoal[]
  cgaAssessments: CGAAssessment[]
  subscription: PatientSubscription | null
  invoices: PatientInvoice[]
}

// ─── 5Ms Strip ────────────────────────────────────────────────────────────────

function getMsStatus(cga: CGAAssessment | undefined) {
  if (!cga) return { body: null, mind: null, mobility: null, meds: null, matters: null }
  return {
    body:     cga.bpSystolic ? (cga.bpSystolic > 140 ? 'warn' : 'ok') : null,
    mind:     cga.mocaScore != null ? (cga.mocaScore < 18 ? 'warn' : cga.mocaScore < 25 ? 'fair' : 'ok') : null,
    mobility: cga.tugSeconds != null ? (cga.tugSeconds > 20 ? 'warn' : cga.tugSeconds > 12 ? 'fair' : 'ok') : null,
    meds:     null,
    matters:  cga.primaryGoal ? 'ok' : null,
  }
}

const MS_COLORS: Record<string, string> = {
  ok:   'bg-green-50 text-green-700 border-green-200',
  fair: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  warn: 'bg-red-50 text-red-700 border-red-200',
}
const MS_ICONS = [
  { key: 'body',     label: 'Body',     icon: Activity },
  { key: 'mind',     label: 'Mind',     icon: Brain },
  { key: 'mobility', label: 'Mobility', icon: Footprints },
  { key: 'meds',     label: 'Meds',     icon: Pill },
  { key: 'matters',  label: 'Matters',  icon: Heart },
]

function FiveMsStrip({ cga, onClick }: { cga: CGAAssessment | undefined; onClick: () => void }) {
  const status = getMsStatus(cga)
  return (
    <div className="flex gap-2 flex-wrap">
      {MS_ICONS.map(({ key, label, icon: Icon }) => {
        const s = status[key as keyof typeof status]
        return (
          <button
            key={key}
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 ${
              s ? MS_COLORS[s] : 'bg-brand-surface border-brand-border text-brand-muted'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {s && <span className="capitalize ml-0.5">· {s}</span>}
            {!s && <span className="ml-0.5">· —</span>}
          </button>
        )
      })}
    </div>
  )
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const ALERT_COLORS: Record<string, string> = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  warn:     'bg-yellow-50 border-yellow-200 text-yellow-700',
  info:     'bg-blue-50 border-blue-200 text-blue-700',
}
const FLAG_COLORS: Record<string, string> = {
  high:     'text-red-600 font-medium',
  low:      'text-blue-600 font-medium',
  critical: 'text-red-700 font-bold',
  normal:   'text-green-600',
}
const VAX_COLORS: Record<string, string> = {
  up_to_date: 'bg-green-50 border-green-200 text-green-700',
  due:        'bg-yellow-50 border-yellow-200 text-yellow-700',
  overdue:    'bg-red-50 border-red-200 text-red-700',
}
const REF_COLORS: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700',
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

// ─── Inline add form ──────────────────────────────────────────────────────────

function AddMedForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', dose: '', frequency: '', indication: '', prescriber: '', isBeersFlagged: false, status: 'active' as string })

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    await fetch(`/api/patients/${patientId}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    router.refresh()
    onDone()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Medication Name *">
          <input value={form.name} onChange={f('name')} placeholder="e.g. Metformin" className={INPUT_CLS} />
        </Field>
        <Field label="Dose">
          <input value={form.dose} onChange={f('dose')} placeholder="e.g. 500mg" className={INPUT_CLS} />
        </Field>
        <Field label="Frequency">
          <input value={form.frequency} onChange={f('frequency')} placeholder="e.g. Twice daily" className={INPUT_CLS} />
        </Field>
        <Field label="Indication">
          <input value={form.indication} onChange={f('indication')} placeholder="e.g. Type 2 Diabetes" className={INPUT_CLS} />
        </Field>
        <Field label="Prescriber">
          <input value={form.prescriber} onChange={f('prescriber')} placeholder="Dr. name" className={INPUT_CLS} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={f('status')} className={INPUT_CLS}>
            <option value="active">Active</option>
            <option value="prn">PRN</option>
            <option value="deprescribe">Consider Deprescribing</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isBeersFlagged} onChange={e => setForm(p => ({ ...p, isBeersFlagged: e.target.checked }))} className="rounded" />
        <span className="text-yellow-700">Beers Criteria / STOPP flag</span>
      </label>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>Save Medication</Button>
      </div>
    </div>
  )
}

function AddLabForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ panelDate: '', category: '', testName: '', result: '', unit: '', referenceMin: '', referenceMax: '', flag: '' as string, priorResult: '', trend: '' as string })

  const save = async () => {
    if (!form.panelDate || !form.testName || !form.result) return
    setSaving(true)
    const body: Record<string, unknown> = { ...form }
    if (!body.category)    delete body.category
    if (!body.flag)        delete body.flag
    if (!body.trend)       delete body.trend
    if (!body.priorResult) delete body.priorResult
    await fetch(`/api/patients/${patientId}/labs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    router.refresh()
    onDone()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Panel Date *">
          <input type="date" value={form.panelDate} onChange={f('panelDate')} className={INPUT_CLS} />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={f('category')} className={INPUT_CLS}>
            <option value="">Select…</option>
            <option value="metabolic">Metabolic Panel</option>
            <option value="blood_count">Blood Count</option>
            <option value="lipids">Lipids</option>
            <option value="vitamins">Vitamins</option>
            <option value="hormones">Hormones</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Test Name *">
          <input value={form.testName} onChange={f('testName')} placeholder="e.g. HbA1c" className={INPUT_CLS} />
        </Field>
        <Field label="Result *">
          <input value={form.result} onChange={f('result')} placeholder="e.g. 7.2" className={INPUT_CLS} />
        </Field>
        <Field label="Unit">
          <input value={form.unit} onChange={f('unit')} placeholder="e.g. %" className={INPUT_CLS} />
        </Field>
        <Field label="Flag">
          <select value={form.flag} onChange={f('flag')} className={INPUT_CLS}>
            <option value="">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
        <Field label="Ref Min">
          <input value={form.referenceMin} onChange={f('referenceMin')} placeholder="e.g. 4.0" className={INPUT_CLS} />
        </Field>
        <Field label="Ref Max">
          <input value={form.referenceMax} onChange={f('referenceMax')} placeholder="e.g. 5.6" className={INPUT_CLS} />
        </Field>
        <Field label="Prior Result">
          <input value={form.priorResult} onChange={f('priorResult')} placeholder="Previous value" className={INPUT_CLS} />
        </Field>
        <Field label="Trend">
          <select value={form.trend} onChange={f('trend')} className={INPUT_CLS}>
            <option value="">—</option>
            <option value="improving">Improving</option>
            <option value="stable">Stable</option>
            <option value="worsening">Worsening</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>Save Lab Result</Button>
      </div>
    </div>
  )
}

function AddVaxForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ vaccineName: '', givenDate: '', nextDueDate: '', status: 'due' as string })

  const VACCINES = ['Influenza', 'Pneumococcal (PCV13)', 'Pneumococcal (PPSV23)', 'Tdap', 'Shingles (Shingrix)', 'Hepatitis B', 'COVID-19', 'Other']

  const save = async () => {
    if (!form.vaccineName) return
    setSaving(true)
    await fetch(`/api/patients/${patientId}/vaccinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, givenDate: form.givenDate || undefined, nextDueDate: form.nextDueDate || undefined }),
    })
    setSaving(false)
    router.refresh()
    onDone()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vaccine *">
          <select value={form.vaccineName} onChange={f('vaccineName')} className={INPUT_CLS}>
            <option value="">Select…</option>
            {VACCINES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={f('status')} className={INPUT_CLS}>
            <option value="up_to_date">Up to date</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </select>
        </Field>
        <Field label="Date Given">
          <input type="date" value={form.givenDate} onChange={f('givenDate')} className={INPUT_CLS} />
        </Field>
        <Field label="Next Due">
          <input type="date" value={form.nextDueDate} onChange={f('nextDueDate')} className={INPUT_CLS} />
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>Save Vaccination</Button>
      </div>
    </div>
  )
}

function AddReferralForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ specialty: '', reason: '', provider: '', referralDate: new Date().toISOString().split('T')[0], appointmentDate: '', status: 'pending' as string })

  const SPECIALTIES = ['Cardiology', 'Neurology', 'Orthopedics', 'Nephrology', 'Endocrinology', 'Ophthalmology', 'Geriatrics', 'Pulmonology', 'Gastroenterology', 'Dermatology', 'Psychiatry', 'Physiotherapy', 'Other']

  const save = async () => {
    if (!form.specialty || !form.reason || !form.referralDate) return
    setSaving(true)
    await fetch(`/api/patients/${patientId}/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, appointmentDate: form.appointmentDate || undefined, provider: form.provider || undefined }),
    })
    setSaving(false)
    router.refresh()
    onDone()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Specialty *">
          <select value={form.specialty} onChange={f('specialty')} className={INPUT_CLS}>
            <option value="">Select…</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={f('status')} className={INPUT_CLS}>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Provider / Facility">
          <input value={form.provider} onChange={f('provider')} placeholder="Hospital or clinic name" className={INPUT_CLS} />
        </Field>
        <Field label="Referral Date *">
          <input type="date" value={form.referralDate} onChange={f('referralDate')} className={INPUT_CLS} />
        </Field>
        <Field label="Appointment Date">
          <input type="date" value={form.appointmentDate} onChange={f('appointmentDate')} className={INPUT_CLS} />
        </Field>
        <div className="col-span-2">
          <Field label="Reason *">
            <textarea value={form.reason} onChange={f('reason')} rows={2} placeholder="Clinical reason for referral…" className={`${INPUT_CLS} h-auto py-1.5`} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>Save Referral</Button>
      </div>
    </div>
  )
}

function AddGoalForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ goal: '', detail: '' })

  const save = async () => {
    if (!form.goal) return
    setSaving(true)
    await fetch(`/api/patients/${patientId}/care-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    router.refresh()
    onDone()
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3">
      <Field label="Goal *">
        <input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Maintain HbA1c below 7.5%" className={INPUT_CLS} />
      </Field>
      <Field label="Details">
        <input value={form.detail} onChange={e => setForm(p => ({ ...p, detail: e.target.value }))} placeholder="Additional context or plan" className={INPUT_CLS} />
      </Field>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>Add Goal</Button>
      </div>
    </div>
  )
}

// ─── CGA Form ─────────────────────────────────────────────────────────────────

function CGAForm({ patientId, users, onDone }: { patientId: string; users: { id: string; firstName: string; lastName: string }[]; onDone: () => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    assessedById: users[0]?.id ?? '',
    assessedAt: new Date().toISOString().split('T')[0],
    mocaScore: '', gdsScore: '', camPositive: '',
    tugSeconds: '', fallsLast6m: '', adlScore: '', iadlScore: '', homeHazards: '',
    bpSystolic: '', bpDiastolic: '', orthoDropMmhg: '', bmi: '',
    primaryGoal: '', livingSituation: '', advanceCarePlan: '' as string,
    mnaNutrition: '', visionNotes: '', hearingNotes: '', continenceNotes: '', notes: '',
  })

  const n = (s: string) => s === '' ? undefined : Number(s)
  const b = (s: string) => s === '' ? undefined : s === 'true'

  const save = async () => {
    setSaving(true)
    await fetch(`/api/patients/${patientId}/cga`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessedById: form.assessedById,
        assessedAt: form.assessedAt,
        mocaScore:  n(form.mocaScore),    gdsScore:  n(form.gdsScore),    camPositive: b(form.camPositive),
        tugSeconds: n(form.tugSeconds),   fallsLast6m: n(form.fallsLast6m), adlScore: n(form.adlScore),
        iadlScore:  n(form.iadlScore),    homeHazards: n(form.homeHazards),
        bpSystolic: n(form.bpSystolic),   bpDiastolic: n(form.bpDiastolic),
        orthoDropMmhg: n(form.orthoDropMmhg), bmi: n(form.bmi),
        primaryGoal: form.primaryGoal || undefined, livingSituation: form.livingSituation || undefined,
        advanceCarePlan: form.advanceCarePlan || undefined,
        mnaNutrition: n(form.mnaNutrition),
        visionNotes: form.visionNotes || undefined, hearingNotes: form.hearingNotes || undefined,
        continenceNotes: form.continenceNotes || undefined, notes: form.notes || undefined,
      }),
    })
    setSaving(false)
    router.refresh()
    onDone()
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assessed By">
          <select value={form.assessedById} onChange={f('assessedById')} className={INPUT_CLS}>
            {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </Field>
        <Field label="Assessment Date">
          <input type="date" value={form.assessedAt} onChange={f('assessedAt')} className={INPUT_CLS} />
        </Field>
      </div>

      <SectionLabel icon={Brain} label="Mind" />
      <div className="grid grid-cols-3 gap-3">
        <Field label="MoCA Score (0–30)"><input type="number" min={0} max={30} value={form.mocaScore} onChange={f('mocaScore')} className={INPUT_CLS} /></Field>
        <Field label="GDS Score (0–15)"><input type="number" min={0} max={15} value={form.gdsScore} onChange={f('gdsScore')} className={INPUT_CLS} /></Field>
        <Field label="CAM (Delirium)">
          <select value={form.camPositive} onChange={f('camPositive')} className={INPUT_CLS}>
            <option value="">Not assessed</option>
            <option value="false">Negative</option>
            <option value="true">Positive</option>
          </select>
        </Field>
      </div>

      <SectionLabel icon={Footprints} label="Mobility" />
      <div className="grid grid-cols-3 gap-3">
        <Field label="TUG (seconds)"><input type="number" step={0.1} min={0} value={form.tugSeconds} onChange={f('tugSeconds')} className={INPUT_CLS} /></Field>
        <Field label="Falls (last 6 mo)"><input type="number" min={0} value={form.fallsLast6m} onChange={f('fallsLast6m')} className={INPUT_CLS} /></Field>
        <Field label="Home Hazards"><input type="number" min={0} value={form.homeHazards} onChange={f('homeHazards')} className={INPUT_CLS} /></Field>
        <Field label="ADL Score (0–6)"><input type="number" min={0} max={6} value={form.adlScore} onChange={f('adlScore')} className={INPUT_CLS} /></Field>
        <Field label="IADL Score (0–8)"><input type="number" min={0} max={8} value={form.iadlScore} onChange={f('iadlScore')} className={INPUT_CLS} /></Field>
      </div>

      <SectionLabel icon={Activity} label="Body (Multicomplexity)" />
      <div className="grid grid-cols-4 gap-3">
        <Field label="BP Systolic"><input type="number" value={form.bpSystolic} onChange={f('bpSystolic')} className={INPUT_CLS} /></Field>
        <Field label="BP Diastolic"><input type="number" value={form.bpDiastolic} onChange={f('bpDiastolic')} className={INPUT_CLS} /></Field>
        <Field label="Ortho Drop (mmHg)"><input type="number" value={form.orthoDropMmhg} onChange={f('orthoDropMmhg')} className={INPUT_CLS} /></Field>
        <Field label="BMI"><input type="number" step={0.1} value={form.bmi} onChange={f('bmi')} className={INPUT_CLS} /></Field>
      </div>

      <SectionLabel icon={Heart} label="Matters Most" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Primary Goal">
          <input value={form.primaryGoal} onChange={f('primaryGoal')} placeholder="What matters most to the patient" className={INPUT_CLS} />
        </Field>
        <Field label="Living Situation">
          <input value={form.livingSituation} onChange={f('livingSituation')} placeholder="e.g. Lives alone, with spouse…" className={INPUT_CLS} />
        </Field>
        <Field label="Advance Care Plan">
          <select value={form.advanceCarePlan} onChange={f('advanceCarePlan')} className={INPUT_CLS}>
            <option value="">Not discussed</option>
            <option value="documented">Documented</option>
            <option value="to_discuss">To Discuss</option>
            <option value="declined">Declined</option>
          </select>
        </Field>
        <Field label="Nutrition MNA (0–14)">
          <input type="number" min={0} max={14} value={form.mnaNutrition} onChange={f('mnaNutrition')} className={INPUT_CLS} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Vision Notes"><input value={form.visionNotes} onChange={f('visionNotes')} placeholder="Issues, aids used…" className={INPUT_CLS} /></Field>
        <Field label="Hearing Notes"><input value={form.hearingNotes} onChange={f('hearingNotes')} placeholder="Issues, hearing aids…" className={INPUT_CLS} /></Field>
        <Field label="Continence Notes"><input value={form.continenceNotes} onChange={f('continenceNotes')} placeholder="Notes…" className={INPUT_CLS} /></Field>
      </div>

      <Field label="Overall Notes">
        <textarea value={form.notes} onChange={f('notes')} rows={3} placeholder="Clinical observations…" className={`${INPUT_CLS} h-auto py-2`} />
      </Field>

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>Save Assessment</Button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT_CLS = 'w-full h-8 rounded-lg border border-brand-border bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-brand-muted mb-1">{label}</label>
      {children}
    </div>
  )
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="w-4 h-4 text-brand-muted" />
      <span className="text-sm font-semibold text-brand-dark">{label}</span>
      <div className="flex-1 border-t border-brand-border" />
    </div>
  )
}

function Row({ label, value, capitalize, mono, children }: { label: string; value?: string | null; capitalize?: boolean; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-brand-muted text-sm">{label}</dt>
      <dd className={`text-sm ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{children ?? value ?? '—'}</dd>
    </div>
  )
}

// ─── Tab components ───────────────────────────────────────────────────────────

function OverviewTab({ patient, onCGAClick }: { patient: PatientData; onCGAClick: () => void }) {
  const latestCGA = patient.cgaAssessments[0]
  const insuranceLabel = INSURANCE_SCHEMES.find(s => s.value === patient.insuranceScheme)?.label ?? patient.insuranceScheme
  const [showAddGoal, setShowAddGoal] = useState(false)

  return (
    <div className="space-y-4">
      {/* 5Ms Strip */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">5Ms Geriatric Summary</h3>
          {latestCGA && <span className="text-xs text-brand-muted">From assessment {formatDate(latestCGA.assessedAt)}</span>}
        </div>
        <FiveMsStrip cga={latestCGA} onClick={onCGAClick} />
        {!latestCGA && (
          <p className="text-xs text-brand-muted mt-2">No CGA completed yet. <button onClick={onCGAClick} className="text-brand-blue hover:underline">Start assessment →</button></p>
        )}
      </Card>

      {/* Clinical Alerts */}
      {patient.alerts.length > 0 && (
        <div className="space-y-2">
          {patient.alerts.map(a => (
            <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${ALERT_COLORS[a.severity] ?? ALERT_COLORS.warn}`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                {a.description && <p className="text-xs mt-0.5 opacity-80">{a.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left: demographics */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3">Demographics</h3>
            <dl className="space-y-2">
              <Row label="DOB" value={`${formatDate(patient.dateOfBirth)} (${calculateAge(patient.dateOfBirth)} yrs)`} />
              <Row label="Gender" value={patient.gender} capitalize />
              <Row label="Blood" value={patient.bloodGroup} />
              {patient.phone && (
                <Row label="Phone">
                  <a href={`tel:${patient.phone}`} className="flex items-center gap-1 text-brand-blue hover:underline text-sm">
                    <Phone className="w-3 h-3" />{patient.phone}
                  </a>
                </Row>
              )}
              {patient.altPhone && <Row label="Alt Phone" value={patient.altPhone} />}
              {patient.email    && <Row label="Email"    value={patient.email} />}
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-muted" />Address</h3>
            <p className="text-sm">{[patient.streetAddress, patient.municipality, patient.district, patient.province].filter(Boolean).join(', ') || '—'}</p>
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-1.5"><Shield className="w-4 h-4 text-brand-muted" />Insurance</h3>
            <dl className="space-y-2">
              <Row label="Scheme" value={insuranceLabel} />
              {patient.insurancePolicyNo && <Row label="Policy #" value={patient.insurancePolicyNo} />}
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3">Care Team</h3>
            <dl className="space-y-2">
              <Row label="Nurse"  value={patient.primaryNurse  ? fullName(patient.primaryNurse)  : 'Unassigned'} />
              <Row label="Doctor" value={patient.primaryDoctor ? fullName(patient.primaryDoctor) : 'Unassigned'} />
              <Row label="Branch" value={patient.branch?.name} />
            </dl>
          </Card>

          {patient.emergencyContactName && (
            <Card>
              <h3 className="mb-3">Emergency Contact</h3>
              <dl className="space-y-2">
                <Row label="Name"     value={patient.emergencyContactName} />
                <Row label="Relation" value={patient.emergencyContactRelation} />
                <Row label="Phone"    value={patient.emergencyContactPhone} />
              </dl>
            </Card>
          )}
        </div>

        {/* Right: clinical sections */}
        <div className="col-span-2 space-y-4">
          {/* Diagnoses */}
          {patient.diagnoses.length > 0 && (
            <Card padding="none">
              <CardHeader><h3>Active Diagnoses</h3></CardHeader>
              <CardBody className="space-y-2">
                {patient.diagnoses.filter(d => !d.resolvedAt).map(d => (
                  <div key={d.id} className="flex items-start gap-3">
                    {d.isPrimary && <Badge variant="danger">Primary</Badge>}
                    {d.icdCode && <span className="font-mono text-xs bg-brand-surface px-1.5 py-0.5 rounded text-brand-muted">{d.icdCode}</span>}
                    <span className="text-sm flex-1">{d.description}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Allergies */}
          {patient.allergies.length > 0 && (
            <Card>
              <h3 className="mb-2">Allergies</h3>
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map(a => (
                  <span key={a} className="px-2 py-0.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full">{a}</span>
                ))}
              </div>
            </Card>
          )}

          {/* Care Plan Goals */}
          <Card padding="none">
            <CardHeader>
              <h3>Care Plan Goals</h3>
              <button onClick={() => setShowAddGoal(g => !g)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add goal
              </button>
            </CardHeader>
            <CardBody className="space-y-3">
              {showAddGoal && <AddGoalForm patientId={patient.id} onDone={() => setShowAddGoal(false)} />}
              {patient.carePlanGoals.length === 0 && !showAddGoal && (
                <p className="text-sm text-brand-muted">No care plan goals yet.</p>
              )}
              {patient.carePlanGoals.map(g => (
                <div key={g.id} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${g.status === 'achieved' ? 'text-green-600' : 'text-brand-muted'}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${g.status === 'achieved' ? 'line-through text-brand-muted' : 'text-brand-dark'}`}>{g.goal}</p>
                    {g.detail && <p className="text-xs text-brand-muted">{g.detail}</p>}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${g.status === 'achieved' ? 'bg-green-50 text-green-700' : g.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{g.status}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Family */}
          {patient.familyMembers.length > 0 && (
            <Card padding="none">
              <CardHeader><h3 className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-muted" />Family / Diaspora</h3></CardHeader>
              <CardBody className="space-y-3">
                {patient.familyMembers.map(fm => (
                  <div key={fm.id} className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{fm.fullName}</p>
                      <p className="text-xs text-brand-muted">{fm.relationship} · {fm.country ?? 'Nepal'}</p>
                    </div>
                    {fm.phone && <a href={`tel:${fm.phone}`} className="text-brand-blue hover:underline text-xs">{fm.phone}</a>}
                    {fm.isPrimaryContact && <Badge variant="info">Primary</Badge>}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function MedicationsTab({ patient }: { patient: PatientData }) {
  const [showAdd, setShowAdd] = useState(false)
  const activeMeds = patient.medications.filter(m => m.isActive)
  const inactiveMeds = patient.medications.filter(m => !m.isActive)

  return (
    <div className="space-y-4">
      <Card padding="none">
        <CardHeader>
          <h3>Medication List</h3>
          <button onClick={() => setShowAdd(v => !v)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add medication
          </button>
        </CardHeader>
        <CardBody className="space-y-3">
          {showAdd && <AddMedForm patientId={patient.id} onDone={() => setShowAdd(false)} />}
          {activeMeds.length === 0 && !showAdd && <p className="text-sm text-brand-muted">No active medications recorded.</p>}
          {activeMeds.map(m => (
            <div key={m.id} className={`rounded-xl border p-3 ${m.isBeersFlagged ? 'border-yellow-200 bg-yellow-50' : 'border-brand-border bg-white'}`}>
              <div className="flex items-start gap-2">
                <Pill className={`w-4 h-4 shrink-0 mt-0.5 ${m.isBeersFlagged ? 'text-yellow-600' : 'text-brand-muted'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-brand-dark">{m.name}</span>
                    {m.dose && <span className="text-xs text-brand-muted">{m.dose}</span>}
                    {m.frequency && <span className="text-xs text-brand-muted">· {m.frequency}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ml-auto ${m.status === 'deprescribe' ? 'bg-orange-100 text-orange-700' : m.status === 'prn' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>{m.status}</span>
                  </div>
                  {m.indication && <p className="text-xs text-brand-muted mt-0.5">{m.indication}</p>}
                  {m.isBeersFlagged && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-yellow-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Beers/STOPP flag</strong>{m.beersNote ? ` — ${m.beersNote}` : ''}</span>
                    </div>
                  )}
                  {m.prescriber && <p className="text-xs text-brand-muted mt-0.5">Prescriber: {m.prescriber}</p>}
                </div>
              </div>
            </div>
          ))}
          {inactiveMeds.length > 0 && (
            <>
              <p className="text-xs font-medium text-brand-muted mt-4 mb-2 uppercase tracking-wide">Discontinued</p>
              {inactiveMeds.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-sm text-brand-muted border-b border-brand-border/50 pb-2">
                  <Pill className="w-4 h-4 shrink-0" />
                  <span className="line-through">{m.name}</span>
                  {m.dose && <span>{m.dose}</span>}
                </div>
              ))}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function LabsTab({ patient }: { patient: PatientData }) {
  const [showAdd, setShowAdd] = useState(false)

  const grouped = patient.labResults.reduce<Record<string, LabResult[]>>((acc, l) => {
    const key = l.category ?? 'other'
    ;(acc[key] ||= []).push(l)
    return acc
  }, {})

  const CATEGORY_LABELS: Record<string, string> = {
    metabolic: 'Metabolic Panel', blood_count: 'Blood Count', lipids: 'Lipids',
    vitamins: 'Vitamins', hormones: 'Hormones', other: 'Other',
  }

  return (
    <div className="space-y-4">
      <Card padding="none">
        <CardHeader>
          <h3>Lab Results</h3>
          <button onClick={() => setShowAdd(v => !v)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add result
          </button>
        </CardHeader>
        <CardBody className="space-y-4">
          {showAdd && <AddLabForm patientId={patient.id} onDone={() => setShowAdd(false)} />}
          {patient.labResults.length === 0 && !showAdd && <p className="text-sm text-brand-muted">No lab results recorded.</p>}
          {Object.entries(grouped).map(([cat, labs]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">{CATEGORY_LABELS[cat] ?? cat}</p>
              <div className="rounded-xl border border-brand-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-surface">
                    <tr className="text-xs text-brand-muted">
                      <th className="text-left px-3 py-2 font-medium">Test</th>
                      <th className="text-left px-3 py-2 font-medium">Result</th>
                      <th className="text-left px-3 py-2 font-medium">Range</th>
                      <th className="text-left px-3 py-2 font-medium">Prior</th>
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {labs.map(l => (
                      <tr key={l.id}>
                        <td className="px-3 py-2 font-medium">{l.testName}</td>
                        <td className={`px-3 py-2 ${l.flag ? FLAG_COLORS[l.flag] ?? '' : ''}`}>
                          {l.result}{l.unit ? ` ${l.unit}` : ''}
                          {l.flag && l.flag !== 'normal' && <span className="ml-1 text-xs uppercase">[{l.flag}]</span>}
                        </td>
                        <td className="px-3 py-2 text-brand-muted text-xs">
                          {l.referenceMin && l.referenceMax ? `${l.referenceMin}–${l.referenceMax}` : l.referenceMin ?? l.referenceMax ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-brand-muted text-xs">
                          {l.priorResult ?? '—'}
                          {l.trend && <span className={`ml-1 ${l.trend === 'improving' ? 'text-green-600' : l.trend === 'worsening' ? 'text-red-600' : 'text-brand-muted'}`}>
                            {l.trend === 'improving' ? '↓' : l.trend === 'worsening' ? '↑' : '→'}
                          </span>}
                        </td>
                        <td className="px-3 py-2 text-brand-muted text-xs">{formatDate(l.panelDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

function VaccinationsTab({ patient }: { patient: PatientData }) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <Card padding="none">
      <CardHeader>
        <h3>Vaccination Record</h3>
        <button onClick={() => setShowAdd(v => !v)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add vaccine
        </button>
      </CardHeader>
      <CardBody className="space-y-3">
        {showAdd && <AddVaxForm patientId={patient.id} onDone={() => setShowAdd(false)} />}
        {patient.vaccinations.length === 0 && !showAdd && <p className="text-sm text-brand-muted">No vaccination records.</p>}
        {patient.vaccinations.map(v => (
          <div key={v.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${VAX_COLORS[v.status] ?? VAX_COLORS.due}`}>
            <Syringe className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">{v.vaccineName}</p>
              <p className="text-xs opacity-80">
                {v.givenDate ? `Given: ${formatDate(v.givenDate)}` : 'Not given'}
                {v.nextDueDate ? ` · Due: ${formatDate(v.nextDueDate)}` : ''}
              </p>
            </div>
            <span className="text-xs font-medium capitalize">{v.status.replace('_', ' ')}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

function ReferralsTab({ patient }: { patient: PatientData }) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <Card padding="none">
      <CardHeader>
        <h3>Referrals</h3>
        <button onClick={() => setShowAdd(v => !v)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> New referral
        </button>
      </CardHeader>
      <CardBody className="space-y-3">
        {showAdd && <AddReferralForm patientId={patient.id} onDone={() => setShowAdd(false)} />}
        {patient.referrals.length === 0 && !showAdd && <p className="text-sm text-brand-muted">No referrals recorded.</p>}
        {patient.referrals.map(r => (
          <div key={r.id} className="flex items-start gap-3 border border-brand-border rounded-xl p-3">
            <Send className="w-4 h-4 shrink-0 mt-0.5 text-brand-muted" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{r.specialty}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${REF_COLORS[r.status] ?? REF_COLORS.pending}`}>{r.status}</span>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">{r.reason}</p>
              {r.provider && <p className="text-xs text-brand-muted">→ {r.provider}</p>}
              <p className="text-xs text-brand-muted mt-1">
                Referred: {formatDate(r.referralDate)}
                {r.appointmentDate ? ` · Appt: ${formatDate(r.appointmentDate)}` : ''}
              </p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

function CGATab({ patient, users }: { patient: PatientData; users: { id: string; firstName: string; lastName: string }[] }) {
  const [showForm, setShowForm] = useState(false)
  const latest = patient.cgaAssessments[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Comprehensive Geriatric Assessment (5Ms)</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3.5 h-3.5" /> New Assessment
        </Button>
      </div>

      {showForm && <CGAForm patientId={patient.id} users={users} onDone={() => setShowForm(false)} />}

      {patient.cgaAssessments.length === 0 && !showForm && (
        <div className="rounded-xl border border-brand-border p-8 text-center text-brand-muted">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No assessments recorded yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-brand-blue hover:underline">Start first assessment →</button>
        </div>
      )}

      {patient.cgaAssessments.map(cga => (
        <Card key={cga.id}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">{formatDate(cga.assessedAt)}</p>
              <p className="text-xs text-brand-muted">By {fullName(cga.assessedBy)}</p>
            </div>
            {cga.visitId && (
              <Link href={`/visits/${cga.visitId}`} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                View visit →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <SectionLabel icon={Brain} label="Mind" />
              <dl className="space-y-1.5">
                <Row label="MoCA"    value={cga.mocaScore != null ? `${cga.mocaScore}/30${cga.mocaScore < 25 ? ' (impaired)' : ' (normal)'}` : null} />
                <Row label="GDS"     value={cga.gdsScore  != null ? `${cga.gdsScore}/15${cga.gdsScore > 9 ? ' (severe)' : cga.gdsScore > 4 ? ' (moderate)' : ' (normal)'}` : null} />
                <Row label="Delirium" value={cga.camPositive == null ? null : cga.camPositive ? 'CAM positive' : 'CAM negative'} />
              </dl>

              <SectionLabel icon={Activity} label="Body" />
              <dl className="space-y-1.5">
                {cga.bpSystolic && <Row label="BP" value={`${cga.bpSystolic}/${cga.bpDiastolic} mmHg`} />}
                {cga.orthoDropMmhg != null && <Row label="Ortho drop" value={`${cga.orthoDropMmhg} mmHg`} />}
                {cga.bmi != null && <Row label="BMI" value={String(cga.bmi)} />}
                {cga.mnaNutrition != null && <Row label="MNA" value={`${cga.mnaNutrition}/14`} />}
              </dl>
            </div>
            <div className="space-y-3">
              <SectionLabel icon={Footprints} label="Mobility" />
              <dl className="space-y-1.5">
                <Row label="TUG"      value={cga.tugSeconds  != null ? `${cga.tugSeconds}s${Number(cga.tugSeconds) > 20 ? ' (high risk)' : Number(cga.tugSeconds) > 12 ? ' (moderate)' : ' (normal)'}` : null} />
                <Row label="Falls"    value={cga.fallsLast6m != null ? `${cga.fallsLast6m} in last 6 mo` : null} />
                <Row label="ADL"      value={cga.adlScore    != null ? `${cga.adlScore}/6`   : null} />
                <Row label="IADL"     value={cga.iadlScore   != null ? `${cga.iadlScore}/8`  : null} />
                <Row label="Hazards"  value={cga.homeHazards != null ? `${cga.homeHazards} home hazards` : null} />
              </dl>

              <SectionLabel icon={Heart} label="Matters Most" />
              <dl className="space-y-1.5">
                <Row label="Goal"    value={cga.primaryGoal} />
                <Row label="Living"  value={cga.livingSituation} />
                <Row label="ACP"     value={cga.advanceCarePlan?.replace('_', ' ')} capitalize />
              </dl>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function VisitsTab({ patient }: { patient: PatientData }) {
  return (
    <Card padding="none">
      <CardHeader>
        <h3>Visit History</h3>
        <Link href={`/visits?patientId=${patient.id}`} className="text-xs text-brand-blue hover:underline">View all</Link>
      </CardHeader>
      {patient.visits.length === 0 ? (
        <CardBody><p className="text-sm text-brand-muted">No visits yet.</p></CardBody>
      ) : (
        <div className="divide-y divide-brand-border/50">
          {patient.visits.map(v => (
            <Link key={v.id} href={`/visits/${v.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-brand-surface/60 transition-colors">
              <Calendar className="w-4 h-4 text-brand-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{v.visitType?.replace(/_/g, ' ') ?? 'Visit'}</p>
                <p className="text-xs text-brand-muted">{formatDateTime(v.scheduledAt)} · {v.nurse ? fullName(v.nurse) : 'Unassigned'}</p>
              </div>
              <VisitStatusBadge status={v.status} />
              <ChevronRight className="w-4 h-4 text-brand-muted" />
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  care_connect:      'bg-blue-50 text-blue-700 border-blue-200',
  wellness_plus:     'bg-green-50 text-green-700 border-green-200',
  chronic_care:      'bg-purple-50 text-purple-700 border-purple-200',
  recovery_care:     'bg-orange-50 text-orange-700 border-orange-200',
  premium_companion: 'bg-red-50 text-red-700 border-red-200',
}

const INV_STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600' },
  sent:      { label: 'Sent',      color: 'bg-blue-50 text-blue-700' },
  paid:      { label: 'Paid',      color: 'bg-green-50 text-green-700' },
  partial:   { label: 'Partial',   color: 'bg-yellow-50 text-yellow-700' },
  overdue:   { label: 'Overdue',   color: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', esewa: 'eSewa',
  khalti: 'Khalti', stripe: 'Stripe', cheque: 'Cheque',
}

function BillingTab({ patient }: { patient: PatientData }) {
  const sub = patient.subscription
  const invoices = patient.invoices

  const totalBilled = invoices.reduce((s, i) => s + i.totalNpr, 0)
  const totalPaid   = invoices.reduce((s, i) => s + i.paidNpr, 0)
  const outstanding = totalBilled - totalPaid

  return (
    <div className="space-y-4">
      {/* Current subscription */}
      <Card>
        <div className="flex items-start justify-between mb-3">
          <h3>Current Subscription</h3>
          <Link href="/billing" className="text-xs text-brand-blue hover:underline">Billing dashboard →</Link>
        </div>
        {!sub ? (
          <div className="text-center py-6 text-brand-muted">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active subscription</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-border bg-brand-surface">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PLAN_COLORS[sub.plan.code] ?? 'bg-gray-100'}`}>
                    {sub.plan.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${sub.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xl font-bold text-brand-dark">{formatMoney(sub.priceNpr)}<span className="text-sm font-normal text-brand-muted">/month</span></p>
                {sub.plan.visitsPerMonth > 0 && (
                  <p className="text-xs text-brand-muted">{sub.plan.visitsPerMonth} visits/month included</p>
                )}
              </div>
              <div className="text-right text-xs text-brand-muted space-y-0.5">
                <p>Since {formatDate(sub.startDate)}</p>
                {sub.renewalDate && <p>Renews {formatDate(sub.renewalDate)}</p>}
                <p className="capitalize">{sub.payerType.replace('_', ' ')}</p>
                {sub.payerName && <p>{sub.payerName}</p>}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-1">
              {sub.plan.features.map(f => (
                <div key={f} className="flex items-start gap-1.5 text-xs text-brand-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-brand-border p-3 text-center">
          <p className="text-2xl font-bold text-brand-dark">{formatMoney(totalBilled)}</p>
          <p className="text-xs text-brand-muted mt-0.5">Total Billed</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{formatMoney(totalPaid)}</p>
          <p className="text-xs text-green-600 mt-0.5">Total Paid</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${outstanding > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-brand-border'}`}>
          <p className={`text-2xl font-bold ${outstanding > 0 ? 'text-yellow-700' : 'text-brand-muted'}`}>{formatMoney(outstanding)}</p>
          <p className={`text-xs mt-0.5 ${outstanding > 0 ? 'text-yellow-600' : 'text-brand-muted'}`}>Outstanding</p>
        </div>
      </div>

      {/* Invoice history */}
      <Card padding="none">
        <CardHeader>
          <h3>Invoice History</h3>
          <Link href="/billing" className="text-xs text-brand-blue hover:underline">View all</Link>
        </CardHeader>
        {invoices.length === 0 ? (
          <CardBody><p className="text-sm text-brand-muted">No invoices yet.</p></CardBody>
        ) : (
          <div className="divide-y divide-brand-border/50">
            {invoices.map(inv => {
              const cfg  = INV_STATUS[inv.status] ?? INV_STATUS.draft
              const due  = inv.totalNpr - inv.paidNpr
              return (
                <Link key={inv.id} href={`/billing/invoices/${inv.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-brand-surface/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium font-mono">{inv.invoiceNo}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-brand-muted">{formatDate(inv.invoiceDate)} · {inv.payerType.replace('_', ' ')}</p>
                    {inv.payments.length > 0 && (
                      <p className="text-xs text-brand-muted">
                        Last payment: {METHOD_LABELS[inv.payments[inv.payments.length - 1]?.method] ?? '—'}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatMoney(inv.totalNpr)}</p>
                    {due > 0 && due < inv.totalNpr && <p className="text-xs text-yellow-600">Due: {formatMoney(due)}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Overview',      icon: Activity },
  { id: 'medications',   label: 'Medications',   icon: Pill },
  { id: 'labs',          label: 'Labs',          icon: FlaskConical },
  { id: 'vaccinations',  label: 'Vaccinations',  icon: Syringe },
  { id: 'referrals',     label: 'Referrals',     icon: Send },
  { id: 'cga',           label: 'Assessment',    icon: Brain },
  { id: 'visits',        label: 'Visits',        icon: Calendar },
  { id: 'billing',       label: 'Billing',       icon: Receipt },
]

export default function PatientChartClient({
  patient, users,
}: {
  patient: PatientData
  users: { id: string; firstName: string; lastName: string }[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const alertCount = patient.alerts.length
  const beersFlagged = patient.medications.filter(m => m.isBeersFlagged && m.isActive).length

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0.5 mb-5 border-b border-brand-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const badge =
            id === 'overview'    ? alertCount :
            id === 'medications' ? beersFlagged : 0
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-brand-muted hover:text-brand-dark'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge > 0 && (
                <span className="ml-0.5 min-w-[1.1rem] h-[1.1rem] rounded-full text-xs bg-red-100 text-red-700 flex items-center justify-center px-1">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'     && <OverviewTab     patient={patient} onCGAClick={() => setActiveTab('cga')} />}
      {activeTab === 'medications'  && <MedicationsTab  patient={patient} />}
      {activeTab === 'labs'         && <LabsTab         patient={patient} />}
      {activeTab === 'vaccinations' && <VaccinationsTab patient={patient} />}
      {activeTab === 'referrals'    && <ReferralsTab    patient={patient} />}
      {activeTab === 'cga'          && <CGATab          patient={patient} users={users} />}
      {activeTab === 'visits'       && <VisitsTab       patient={patient} />}
      {activeTab === 'billing'      && <BillingTab      patient={patient} />}
    </div>
  )
}
