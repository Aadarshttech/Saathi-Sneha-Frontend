import { redirect, notFound } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { formatDateTime, calculateAge, fullName } from '@/lib/utils'
import { SERVICE_CODE_LABELS } from '@/lib/constants'
import VisitChartClient from '@/app/(dashboard)/visits/[id]/visit-chart-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Visit' }

const STATUS_STYLES: Record<string, string> = {
  requested:   'bg-pink-100 text-pink-700',
  scheduled:   'bg-blue-100 text-blue-700',
  en_route:    'bg-yellow-100 text-yellow-700',
  checked_in:  'bg-purple-100 text-purple-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
  missed:      'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  requested:   'Requested',
  scheduled:   'Scheduled',
  en_route:    'On the way',
  checked_in:  'Arrived',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  missed:      'Missed',
}

export default async function ProviderVisitDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal')

  const [visit, users] = await Promise.all([
    prisma.visit.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: {
            id: true, mrn: true, firstName: true, lastName: true,
            dateOfBirth: true, phone: true, bloodGroup: true,
            chronicConditions: true,
            diagnoses: {
              where:  { resolvedAt: null },
              select: { id: true, icdCode: true, description: true, isPrimary: true },
            },
            medications: {
              orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
              select:  { id: true, name: true, dose: true, frequency: true, status: true, isActive: true },
            },
          },
        },
        nurse:    { select: { id: true, firstName: true, lastName: true, phone: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        tasks:    { select: { id: true, serviceCode: true, taskName: true, status: true, notes: true } },
        vitals:   { orderBy: { recordedAt: 'desc' } },
        cgaAssessments: {
          include: { assessedBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { assessedAt: 'desc' },
          take:    1,
        },
      },
    }),
    prisma.user.findMany({
      where:   { isActive: true },
      select:  { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: 'asc' },
      take:    100,
    }),
  ])

  if (!visit) notFound()

  const isEditable = !['completed', 'cancelled', 'missed'].includes(visit.status)

  const existingCGA = visit.cgaAssessments[0]
    ? {
        ...visit.cgaAssessments[0],
        tugSeconds: visit.cgaAssessments[0].tugSeconds != null ? Number(visit.cgaAssessments[0].tugSeconds) : null,
        bmi:        visit.cgaAssessments[0].bmi        != null ? Number(visit.cgaAssessments[0].bmi)        : null,
      }
    : null

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <Link
          href="/provider-portal/visits"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> My Visits
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {visit.patient.firstName} {visit.patient.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">{formatDateTime(visit.scheduledAt)}</p>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[visit.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[visit.status] ?? visit.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient summary sidebar */}
        <div className="space-y-4">
          {/* Patient card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Patient</h2>
              <Link
                href={`/provider-portal/patients/${visit.patient.id}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                View chart <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Name"   value={`${visit.patient.firstName} ${visit.patient.lastName}`} />
              <Row label="MRN"    value={visit.patient.mrn} mono />
              <Row label="Age"    value={`${calculateAge(visit.patient.dateOfBirth)} yrs`} />
              <Row label="Blood"  value={visit.patient.bloodGroup ?? '—'} />
              <Row label="Phone"  value={visit.patient.phone  ?? '—'} />
              <Row label="Nurse"  value={visit.nurse ? fullName(visit.nurse) : 'Unassigned'} />
            </div>
            {visit.patient.chronicConditions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Conditions</p>
                <div className="flex flex-wrap gap-1.5">
                  {visit.patient.chronicConditions.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active diagnoses */}
          {visit.patient.diagnoses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Active Diagnoses</h2>
              <ul className="space-y-1.5">
                {visit.patient.diagnoses.map(d => (
                  <li key={d.id} className="text-sm">
                    {d.icdCode && <span className="font-mono text-xs text-gray-400 mr-1.5">{d.icdCode}</span>}
                    {d.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vitals history */}
          {visit.vitals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Vitals Recorded</h2>
              <div className="space-y-3">
                {visit.vitals.map(v => (
                  <div key={v.id} className="text-xs space-y-1">
                    <p className="text-gray-400">{formatDateTime(v.recordedAt)}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-700">
                      {v.bloodPressureSys  && <span>BP: {v.bloodPressureSys}/{v.bloodPressureDia}</span>}
                      {v.heartRate         && <span>HR: {v.heartRate} bpm</span>}
                      {v.temperature       && <span>Temp: {Number(v.temperature).toFixed(1)}°C</span>}
                      {v.oxygenSaturation  && <span>SpO₂: {Number(v.oxygenSaturation).toFixed(1)}%</span>}
                      {v.bloodGlucose      && <span>Glucose: {Number(v.bloodGlucose)} mg/dL</span>}
                      {v.painScore != null && <span>Pain: {v.painScore}/10</span>}
                      {v.weight            && <span>Weight: {Number(v.weight)} kg</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart area (col-span-2) — reuses the full admin VisitChartClient */}
        <div className="lg:col-span-2">
          <VisitChartClient
            visitId={visit.id}
            initialStatus={visit.status}
            scheduledAt={visit.scheduledAt.toISOString()}
            durationMin={visit.durationMin}
            nurseId={visit.nurseId}
            nurses={users.filter(u => u.role === 'nurse')}
            tasks={visit.tasks.map(t => ({
              id:          t.id,
              serviceCode: t.serviceCode ?? '',
              label:       t.taskName ?? (t.serviceCode ? (SERVICE_CODE_LABELS[t.serviceCode] ?? t.serviceCode) : 'Task'),
              status:      t.status,
              notes:       t.notes ?? '',
            }))}
            nurseNotes={visit.nurseNotes ?? ''}
            providerNotes={visit.providerNotes ?? ''}
            isEditable={isEditable}
            defaultAssessedById={visit.providerId ?? visit.nurseId ?? users[0]?.id ?? ''}
            users={users}
            existingCGA={existingCGA as never}
            patientId={visit.patient.id}
            medications={visit.patient.medications}
          />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-gray-400 text-xs">{label}</dt>
      <dd className={`text-xs text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}
