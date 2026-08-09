'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, differenceInYears, parseISO } from 'date-fns'
import {
  User, Activity, Pill, FlaskConical, Calendar, ClipboardList,
  Users, AlertTriangle, ChevronRight, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Patient {
  id: string; firstName: string; lastName: string
  firstNameNepali: string | null; lastNameNepali: string | null
  mrn: string; dateOfBirth: string; gender: string | null
  phone: string | null; altPhone: string | null; email: string | null
  bloodGroup: string | null; nationalId: string | null; primaryLanguage: string
  province: string | null; district: string | null; municipality: string | null
  wardNo: number | null; tole: string | null; streetAddress: string | null; landmark: string | null
  insuranceScheme: string; insurancePolicyNo: string | null; insuranceExpiry: string | null
  chronicConditions: string[]; allergies: string[]
  emergencyContactName: string | null; emergencyContactPhone: string | null; emergencyContactRelation: string | null
  primaryNurse:  { firstName: string; lastName: string } | null
  primaryDoctor: { firstName: string; lastName: string } | null
  diagnoses: { id: string; icdCode: string | null; description: string; isPrimary: boolean; diagnosedAt: string | null }[]
  familyMembers: { id: string; fullName: string; relationship: string; phone: string | null; email: string | null; country: string | null; isPrimaryContact: boolean; canReceiveUpdates: boolean }[]
}
interface Vital {
  id: string; recordedAt: string
  bloodPressureSys: number | null; bloodPressureDia: number | null
  heartRate: number | null; temperature: number | null
  oxygenSaturation: number | null; bloodGlucose: number | null
  weight: number | null; height: number | null; painScore: number | null; notes: string | null
}
interface Medication {
  id: string; name: string; nameNepali: string | null
  dose: string | null; frequency: string | null; indication: string | null; prescriber: string | null
  isActive: boolean; isBeersFlagged: boolean; beersNote: string | null; status: string; notes: string | null
  startDate: string | null; endDate: string | null
}
interface LabResult {
  id: string; panelDate: string; category: string | null
  testName: string; result: string; unit: string | null; flag: string | null
  referenceMin: number | null; referenceMax: number | null; priorResult: string | null; trend: string | null; notes: string | null
}
interface Visit {
  id: string; scheduledAt: string; scheduledEnd: string; status: string
  serviceCode: string | null; visitType: string | null; notes: string | null
  nurse:    { firstName: string; lastName: string } | null
  provider: { firstName: string; lastName: string } | null
  tasks: { id: string; status: string }[]
}
interface Goal {
  id: string; goal: string; priority: string; status: string; detail: string | null
}
interface CGA {
  id: string; assessedAt: string; assessedBy: { firstName: string; lastName: string }
  mocaScore: number | null; gdsScore: number | null; camPositive: boolean | null
  tugSeconds: number | null; fallsLast6m: number | null; adlScore: number | null; iadlScore: number | null
  bmi: number | null; primaryGoal: string | null; livingSituation: string | null; advanceCarePlan: string | null; notes: string | null
}
interface Alert {
  id: string; title: string; description: string | null; severity: string; createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_STYLES: Record<string, string> = {
  normal:   'bg-green-100 text-green-700',
  high:     'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700 font-bold',
}
const STATUS_STYLES: Record<string, string> = {
  scheduled:   'bg-blue-100 text-blue-700',
  en_route:    'bg-yellow-100 text-yellow-700',
  checked_in:  'bg-purple-100 text-purple-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
  missed:      'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', en_route: 'On the way', checked_in: 'Arrived',
  in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled', missed: 'Missed',
}
const SERVICE_LABELS: Record<string, string> = {
  wellness_check: 'Wellness Check', chronic_disease_monitoring: 'Chronic Disease Monitoring',
  medication_management: 'Medication Management', doctor_consultation: 'Doctor Consultation',
  lab_coordination: 'Lab Coordination', physiotherapy: 'Physiotherapy',
  post_hospital_care: 'Post-Hospital Care', doctor_on_call: 'Doctor On Call',
  caregiver_support: 'Caregiver Support', mental_wellness_check: 'Mental Wellness Check',
  urgent_nurse_visit: 'Urgent Nurse Visit',
}
const GOAL_STATUS_STYLES: Record<string, string> = {
  active:        'bg-blue-100 text-blue-700',
  achieved:      'bg-green-100 text-green-700',
  on_hold:       'bg-yellow-100 text-yellow-700',
  discontinued:  'bg-gray-100 text-gray-500',
}
const INSURANCE_LABELS: Record<string, string> = {
  none: 'None / Self-Pay', nsia: 'NSIA', sehat_bima: 'Sehat Bima Yojana',
  ssf: 'SSF (Social Security Fund)', private: 'Private Insurance',
}
const CAT_LABELS: Record<string, string> = {
  metabolic: 'Metabolic', blood_count: 'Blood Count', lipids: 'Lipids', vitamins: 'Vitamins',
}

const TABS = [
  { id: 'overview',     label: 'Overview',    icon: User },
  { id: 'vitals',       label: 'Vitals',      icon: Activity },
  { id: 'medications',  label: 'Medications', icon: Pill },
  { id: 'labs',         label: 'Lab Results', icon: FlaskConical },
  { id: 'visits',       label: 'Visits',      icon: Calendar },
  { id: 'careplan',     label: 'Care Plan',   icon: ClipboardList },
  { id: 'family',       label: 'Family',      icon: Users },
]

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-xs text-gray-900">{value}</span>
    </div>
  )
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({ patient, alerts }: { patient: Patient; alerts: Alert[] }) {
  return (
    <div className="space-y-4">
      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 ${
              a.severity === 'critical' ? 'border-red-200 bg-red-50' :
              a.severity === 'warn'     ? 'border-orange-200 bg-orange-50' : 'border-blue-100 bg-blue-50'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                a.severity === 'critical' ? 'text-red-500' :
                a.severity === 'warn'     ? 'text-orange-500' : 'text-blue-400'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{a.title}</p>
                {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Personal info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Personal Information</h3>
          <InfoRow label="Date of Birth" value={format(parseISO(patient.dateOfBirth), 'MMMM d, yyyy')} />
          <InfoRow label="Gender"        value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : null} />
          <InfoRow label="Phone"         value={patient.phone} />
          <InfoRow label="Alt Phone"     value={patient.altPhone} />
          <InfoRow label="Email"         value={patient.email} />
          <InfoRow label="Blood Group"   value={patient.bloodGroup} />
          <InfoRow label="National ID"   value={patient.nationalId} />
          <InfoRow label="Language"      value={patient.primaryLanguage === 'ne' ? 'Nepali' : patient.primaryLanguage === 'en' ? 'English' : patient.primaryLanguage} />
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Address</h3>
          <InfoRow label="Province"     value={patient.province} />
          <InfoRow label="District"     value={patient.district} />
          <InfoRow label="Municipality" value={patient.municipality} />
          <InfoRow label="Ward No."     value={patient.wardNo != null ? String(patient.wardNo) : null} />
          <InfoRow label="Tole"         value={patient.tole} />
          <InfoRow label="Street"       value={patient.streetAddress} />
          <InfoRow label="Landmark"     value={patient.landmark} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Medical */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Medical</h3>
          {patient.chronicConditions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Chronic Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {patient.chronicConditions.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-orange-50 text-orange-700 rounded-full border border-orange-100">{c}</span>
                ))}
              </div>
            </div>
          )}
          {patient.allergies.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1.5">Allergies</p>
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full border border-red-100">⚠ {a}</span>
                ))}
              </div>
            </div>
          )}
          <InfoRow label="Insurance"   value={INSURANCE_LABELS[patient.insuranceScheme] ?? patient.insuranceScheme} />
          <InfoRow label="Policy No."  value={patient.insurancePolicyNo} />
          <InfoRow label="Ins. Expiry" value={patient.insuranceExpiry ? format(parseISO(patient.insuranceExpiry), 'MMM d, yyyy') : null} />
        </div>

        {/* Care team + diagnoses + emergency */}
        <div className="space-y-4">
          {patient.diagnoses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Active Diagnoses</h3>
              <ul className="space-y-1.5">
                {patient.diagnoses.map(d => (
                  <li key={d.id} className="text-xs">
                    {d.icdCode && <span className="font-mono text-gray-400 mr-1.5">{d.icdCode}</span>}
                    <span className={d.isPrimary ? 'font-medium text-gray-900' : 'text-gray-700'}>{d.description}</span>
                    {d.isPrimary && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Primary</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {patient.emergencyContactName && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Emergency Contact</h3>
              <InfoRow label="Name"     value={patient.emergencyContactName} />
              <InfoRow label="Relation" value={patient.emergencyContactRelation} />
              <InfoRow label="Phone"    value={patient.emergencyContactPhone} />
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Care Team</h3>
            {patient.primaryNurse  && <InfoRow label="Primary Nurse"    value={`${patient.primaryNurse.firstName} ${patient.primaryNurse.lastName}`} />}
            {patient.primaryDoctor && <InfoRow label="Primary Doctor"   value={`Dr. ${patient.primaryDoctor.firstName} ${patient.primaryDoctor.lastName}`} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function VitalsTab({ vitals }: { vitals: Vital[] }) {
  if (vitals.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <Activity className="w-10 h-10 mx-auto mb-2 text-gray-200" />
      <p className="text-sm">No vitals recorded</p>
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Date', 'BP (mmHg)', 'HR (bpm)', 'Temp (°C)', 'SpO₂ (%)', 'Glucose (mg/dL)', 'Weight (kg)', 'Pain', 'Notes'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vitals.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{format(new Date(v.recordedAt), 'MMM d, yyyy h:mm a')}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{v.bloodPressureSys ? `${v.bloodPressureSys}/${v.bloodPressureDia}` : '—'}</td>
                <td className="px-3 py-2 text-gray-700">{v.heartRate        ?? '—'}</td>
                <td className="px-3 py-2 text-gray-700">{v.temperature      != null ? Number(v.temperature).toFixed(1) : '—'}</td>
                <td className="px-3 py-2 text-gray-700">{v.oxygenSaturation != null ? Number(v.oxygenSaturation).toFixed(1) : '—'}</td>
                <td className="px-3 py-2 text-gray-700">{v.bloodGlucose     != null ? Number(v.bloodGlucose) : '—'}</td>
                <td className="px-3 py-2 text-gray-700">{v.weight           != null ? Number(v.weight).toFixed(1) : '—'}</td>
                <td className="px-3 py-2 text-gray-700">{v.painScore        != null ? `${v.painScore}/10` : '—'}</td>
                <td className="px-3 py-2 text-gray-500 italic max-w-xs truncate">{v.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MedicationsTab({ medications }: { medications: Medication[] }) {
  const active       = medications.filter(m => m.isActive)
  const discontinued = medications.filter(m => !m.isActive)

  function MedCard({ med }: { med: Medication }) {
    return (
      <div className={`bg-white rounded-xl border p-4 ${med.isBeersFlagged ? 'border-orange-300' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{med.name}</p>
            {med.nameNepali && <p className="text-xs text-gray-400">{med.nameNepali}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {med.isBeersFlagged && <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">⚠ Beers</span>}
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${med.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {med.isActive ? 'Active' : 'Discontinued'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 text-xs">
          {med.dose       && <InfoRow label="Dose"        value={med.dose} />}
          {med.frequency  && <InfoRow label="Frequency"   value={med.frequency} />}
          {med.indication && <InfoRow label="For"         value={med.indication} />}
          {med.prescriber && <InfoRow label="Prescribed"  value={med.prescriber} />}
          {med.startDate  && <InfoRow label="Start"       value={format(parseISO(med.startDate), 'MMM d, yyyy')} />}
          {med.endDate    && <InfoRow label="End"         value={format(parseISO(med.endDate),   'MMM d, yyyy')} />}
        </div>
        {med.isBeersFlagged && med.beersNote && (
          <div className="mt-2 text-xs text-orange-700 bg-orange-50 rounded-lg p-2 border border-orange-200">{med.beersNote}</div>
        )}
        {med.notes && <p className="text-xs text-gray-400 mt-1 italic">{med.notes}</p>}
      </div>
    )
  }

  if (medications.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <Pill className="w-10 h-10 mx-auto mb-2 text-gray-200" />
      <p className="text-sm">No medications recorded</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {active.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active ({active.length})</p>
          <div className="space-y-2">{active.map(m => <MedCard key={m.id} med={m} />)}</div>
        </section>
      )}
      {discontinued.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Discontinued</p>
          <div className="space-y-2 opacity-60">{discontinued.map(m => <MedCard key={m.id} med={m} />)}</div>
        </section>
      )}
    </div>
  )
}

function LabsTab({ labResults }: { labResults: LabResult[] }) {
  if (labResults.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <FlaskConical className="w-10 h-10 mx-auto mb-2 text-gray-200" />
      <p className="text-sm">No lab results recorded</p>
    </div>
  )

  const byDate = labResults.reduce<Record<string, LabResult[]>>((acc, r) => {
    ;(acc[r.panelDate] = acc[r.panelDate] ?? []).push(r)
    return acc
  }, {})

  const TREND_ICON: Record<string, React.ReactNode> = {
    improving: <TrendingDown className="w-3 h-3 text-green-500" />,
    worsening: <TrendingUp   className="w-3 h-3 text-red-500"   />,
    stable:    <Minus        className="w-3 h-3 text-gray-400"  />,
  }

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([date, results]) => (
        <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{format(parseISO(date), 'MMMM d, yyyy')}</p>
            <p className="text-xs text-gray-400">{results.length} test{results.length > 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {results.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{r.testName}</p>
                    {r.category && <span className="text-xs text-gray-400">{CAT_LABELS[r.category] ?? r.category}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 italic mt-0.5">{r.notes}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {r.priorResult && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      {r.trend && TREND_ICON[r.trend]}
                      <span>prev: {r.priorResult}</span>
                    </div>
                  )}
                  {(r.referenceMin != null || r.referenceMax != null) && (
                    <span className="text-xs text-gray-400">
                      ({r.referenceMin ?? '?'} – {r.referenceMax ?? '?'} {r.unit ?? ''})
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-900">
                    {r.result}{r.unit && <span className="text-xs font-normal text-gray-400 ml-0.5">{r.unit}</span>}
                  </span>
                  {r.flag && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${FLAG_STYLES[r.flag] ?? 'bg-gray-100 text-gray-500'}`}>
                      {r.flag.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function VisitsTab({ visits }: { visits: Visit[] }) {
  const now      = new Date()
  const upcoming = visits.filter(v => new Date(v.scheduledAt) >= now && v.status !== 'cancelled' && v.status !== 'completed')
  const past     = visits.filter(v => new Date(v.scheduledAt) <  now || v.status === 'completed' || v.status === 'cancelled' || v.status === 'missed')

  if (visits.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-200" />
      <p className="text-sm">No visits recorded</p>
    </div>
  )

  function VisitCard({ v }: { v: Visit }) {
    const done  = v.tasks.filter(t => t.status === 'completed').length
    const total = v.tasks.length
    return (
      <Link
        href={`/provider-portal/visits/${v.id}`}
        className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {format(new Date(v.scheduledAt), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(v.scheduledAt), 'h:mm a')} – {format(new Date(v.scheduledEnd), 'h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABELS[v.status] ?? v.status}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
        {v.serviceCode && (
          <p className="text-xs text-blue-600 mt-1">{SERVICE_LABELS[v.serviceCode] ?? v.serviceCode}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-400">
          {v.nurse    && <span>Nurse: {v.nurse.firstName} {v.nurse.lastName}</span>}
          {v.provider && <span>Dr: {v.provider.firstName} {v.provider.lastName}</span>}
          {total > 0  && <span>{done}/{total} tasks</span>}
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
          <div className="space-y-2">{upcoming.map(v => <VisitCard key={v.id} v={v} />)}</div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</p>
          <div className="space-y-2">{past.map(v => <VisitCard key={v.id} v={v} />)}</div>
        </section>
      )}
    </div>
  )
}

function CarePlanTab({ goals, cga }: { goals: Goal[]; cga: CGA | null }) {
  const PRIORITY: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-600' }
  return (
    <div className="space-y-5">
      {/* Goals */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Care Goals</p>
        {goals.length === 0 ? (
          <p className="text-sm text-gray-400">No care goals on file</p>
        ) : (
          <div className="space-y-2">
            {goals.map(g => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">{g.goal}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY[g.priority] ?? 'bg-gray-100 text-gray-500'}`}>{g.priority}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${GOAL_STATUS_STYLES[g.status] ?? 'bg-gray-100 text-gray-500'}`}>{g.status.replace('_', ' ')}</span>
                  </div>
                </div>
                {g.detail && <p className="text-xs text-gray-500 italic mt-1">{g.detail}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CGA Summary */}
      {cga && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Latest CGA Assessment — {format(new Date(cga.assessedAt), 'MMM d, yyyy')}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-3">
              Assessed by {cga.assessedBy.firstName} {cga.assessedBy.lastName}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {cga.mocaScore   != null && <ScoreCard label="MoCA"    value={`${cga.mocaScore}/30`}  warning={cga.mocaScore < 26} critical={cga.mocaScore < 18} />}
              {cga.gdsScore    != null && <ScoreCard label="GDS"     value={`${cga.gdsScore}/15`}   warning={cga.gdsScore > 4}   critical={cga.gdsScore > 9}  />}
              {cga.tugSeconds  != null && <ScoreCard label="TUG"     value={`${cga.tugSeconds}s`}   warning={cga.tugSeconds > 12} critical={cga.tugSeconds > 20} />}
              {cga.fallsLast6m != null && <ScoreCard label="Falls"   value={`${cga.fallsLast6m} / 6 mo`} warning={cga.fallsLast6m > 0} critical={cga.fallsLast6m > 2} />}
              {cga.adlScore    != null && <ScoreCard label="ADL"     value={`${cga.adlScore}/6`}    warning={cga.adlScore < 4}   critical={cga.adlScore < 2}  />}
              {cga.iadlScore   != null && <ScoreCard label="IADL"    value={`${cga.iadlScore}/8`}   warning={cga.iadlScore < 5}  critical={cga.iadlScore < 3} />}
              {cga.bmi         != null && <ScoreCard label="BMI"     value={String(cga.bmi)}        warning={cga.bmi > 25 || cga.bmi < 18.5} critical={false} />}
              {cga.camPositive != null && <ScoreCard label="Delirium" value={cga.camPositive ? 'CAM+' : 'CAM−'} warning={false} critical={!!cga.camPositive} />}
            </div>
            {(cga.primaryGoal || cga.livingSituation || cga.advanceCarePlan) && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                <InfoRow label="Patient Goal"    value={cga.primaryGoal} />
                <InfoRow label="Living Situation" value={cga.livingSituation} />
                <InfoRow label="Advance Care"    value={cga.advanceCarePlan?.replace('_', ' ')} />
              </div>
            )}
            {cga.notes && <p className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-gray-100">{cga.notes}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreCard({ label, value, warning, critical }: { label: string; value: string; warning: boolean; critical: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${critical ? 'border-red-200 bg-red-50' : warning ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${critical ? 'text-red-600' : warning ? 'text-yellow-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function FamilyTab({ familyMembers }: { familyMembers: Patient['familyMembers'] }) {
  if (familyMembers.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
      <p className="text-sm">No family members on file</p>
    </div>
  )
  return (
    <div className="space-y-2">
      {familyMembers.map(fm => (
        <div key={fm.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {fm.fullName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{fm.fullName}</p>
            <p className="text-xs text-gray-500">{fm.relationship}{fm.country ? ` · ${fm.country}` : ''}</p>
            {(fm.phone || fm.email) && (
              <p className="text-xs text-gray-400">{[fm.phone, fm.email].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {fm.isPrimaryContact   && <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">Emergency</span>}
            {fm.canReceiveUpdates  && <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">Gets updates</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PatientChartPortal({
  patient, vitals, medications, labResults, visits, goals, cga, alerts,
}: {
  patient:     Patient
  vitals:      Vital[]
  medications: Medication[]
  labResults:  LabResult[]
  visits:      Visit[]
  goals:       Goal[]
  cga:         CGA | null
  alerts:      Alert[]
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const age = differenceInYears(new Date(), parseISO(patient.dateOfBirth))

  const badgeCounts: Record<string, number | undefined> = {
    vitals:      vitals.length       || undefined,
    medications: medications.filter(m => m.isActive).length || undefined,
    labs:        labResults.length   || undefined,
    visits:      visits.length       || undefined,
    careplan:    goals.length        || undefined,
    family:      patient.familyMembers.length || undefined,
  }

  return (
    <div className="space-y-5">
      {/* Patient header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
          {(patient.firstNameNepali || patient.lastNameNepali) && (
            <p className="text-sm text-gray-500">{patient.firstNameNepali} {patient.lastNameNepali}</p>
          )}
          <p className="text-sm text-gray-500 mt-0.5">
            {age} yrs · {patient.gender ?? ''} · MRN: {patient.mrn}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {patient.bloodGroup && (
            <span className="px-3 py-1 text-sm font-bold bg-red-50 text-red-600 rounded-lg border border-red-100">
              {patient.bloodGroup}
            </span>
          )}
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-0.5 bg-white rounded-xl border border-gray-200 p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors relative ${
              activeTab === id
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badgeCounts[id] != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {badgeCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview'    && <OverviewTab    patient={patient} alerts={alerts} />}
        {activeTab === 'vitals'      && <VitalsTab      vitals={vitals} />}
        {activeTab === 'medications' && <MedicationsTab medications={medications} />}
        {activeTab === 'labs'        && <LabsTab        labResults={labResults} />}
        {activeTab === 'visits'      && <VisitsTab      visits={visits} />}
        {activeTab === 'careplan'    && <CarePlanTab    goals={goals} cga={cga} />}
        {activeTab === 'family'      && <FamilyTab      familyMembers={patient.familyMembers} />}
      </div>
    </div>
  )
}
