import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { VisitStatusBadge } from '@/components/ui/badge'
import { formatDate, formatDateTime, calculateAge, fullName } from '@/lib/utils'
import { SERVICE_CODE_LABELS } from '@/lib/constants'
import VisitChartClient from './visit-chart-client'
import prisma from '@/lib/prisma'

export const metadata: Metadata = { title: 'Visit' }

async function getVisit(id: string) {
  return prisma.visit.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true, mrn: true, firstName: true, lastName: true,
          dateOfBirth: true, phone: true, bloodGroup: true,
          diagnoses: { where: { resolvedAt: null }, select: { id: true, icdCode: true, description: true, isPrimary: true } },
          medications: { orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }], select: { id: true, name: true, dose: true, frequency: true, status: true, isActive: true } },
        },
      },
      nurse:    { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      tasks:    { select: { id: true, serviceCode: true, taskName: true, status: true, notes: true } },
      vitals:   { orderBy: { recordedAt: 'desc' } },
      cgaAssessments: {
        include: { assessedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { assessedAt: 'desc' },
        take: 1,
      },
    },
  })
}

async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: { firstName: 'asc' },
    take: 100,
  })
}

export default async function VisitDetailPage({ params }: { params: { id: string } }) {
  const [visit, users] = await Promise.all([getVisit(params.id), getUsers()])
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
    <div className="p-6 space-y-5">
      <div>
        <Link href="/visits" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark mb-3">
          <ChevronLeft className="w-4 h-4" /> Visits
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="capitalize">{visit.visitType?.replace(/_/g, ' ')} — {fullName(visit.patient)}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-brand-muted">{formatDateTime(visit.scheduledAt)}</p>
              <VisitStatusBadge status={visit.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Patient summary */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3">Patient</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Name">
                <Link href={`/patients/${visit.patient.id}`} className="text-brand-blue hover:underline font-medium">
                  {fullName(visit.patient)}
                </Link>
              </Row>
              <Row label="MRN"   value={visit.patient.mrn} mono />
              <Row label="Age"   value={`${calculateAge(visit.patient.dateOfBirth)} yrs`} />
              <Row label="Blood" value={visit.patient.bloodGroup ?? '—'} />
              <Row label="Phone" value={visit.patient.phone ?? '—'} />
              <Row label="Nurse" value={visit.nurse ? fullName(visit.nurse) : 'Unassigned'} />
              {visit.provider && <Row label="Provider" value={fullName(visit.provider)} />}
            </dl>
          </Card>

          {visit.patient.diagnoses.length > 0 && (
            <Card>
              <h3 className="mb-3">Active Diagnoses</h3>
              <ul className="space-y-1.5">
                {visit.patient.diagnoses.map(d => (
                  <li key={d.id} className="text-sm">
                    {d.icdCode && <span className="font-mono text-xs text-brand-muted mr-1.5">{d.icdCode}</span>}
                    {d.description}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {visit.vitals.length > 0 && (
            <Card padding="none">
              <CardHeader><h3>Vitals Recorded</h3></CardHeader>
              <CardBody className="space-y-3">
                {visit.vitals.map(v => (
                  <div key={v.id} className="text-xs space-y-1">
                    <p className="text-brand-muted">{formatDateTime(v.recordedAt)}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      {v.bloodPressureSys && <span>BP: {v.bloodPressureSys}/{v.bloodPressureDia}</span>}
                      {v.heartRate        && <span>HR: {v.heartRate} bpm</span>}
                      {v.temperature      && <span>Temp: {Number(v.temperature).toFixed(1)}°C</span>}
                      {v.oxygenSaturation && <span>SpO₂: {Number(v.oxygenSaturation).toFixed(1)}%</span>}
                      {v.bloodGlucose     && <span>Glucose: {Number(v.bloodGlucose)} mg/dL</span>}
                      {v.painScore != null && <span>Pain: {v.painScore}/10</span>}
                      {v.weight           && <span>Weight: {Number(v.weight)} kg</span>}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Charting area */}
        <div className="col-span-2">
          <VisitChartClient
            visitId={visit.id}
            initialStatus={visit.status}
            scheduledAt={visit.scheduledAt.toISOString()}
            durationMin={visit.durationMin}
            nurseId={visit.nurseId}
            nurses={users.filter(u => u.role === 'nurse')}
            tasks={visit.tasks.map(t => ({
              id: t.id,
              serviceCode: t.serviceCode ?? '',
              label: t.taskName ?? (t.serviceCode ? (SERVICE_CODE_LABELS[t.serviceCode] ?? t.serviceCode) : 'Task'),
              status: t.status,
              notes: t.notes ?? '',
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

function Row({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-brand-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-xs' : undefined}>{children ?? value}</dd>
    </div>
  )
}
