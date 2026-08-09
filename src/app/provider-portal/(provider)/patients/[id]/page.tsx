import { redirect, notFound } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PatientChartPortal from './patient-chart-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Patient Chart' }

export default async function ProviderPatientChartPage({
  params,
}: {
  params: { id: string }
}) {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal')

  const [patient, vitals, medications, labResults, visits, goals, cga, alerts] = await Promise.all([
    prisma.patient.findUnique({
      where:   { id: params.id },
      include: {
        primaryNurse:  { select: { firstName: true, lastName: true } },
        primaryDoctor: { select: { firstName: true, lastName: true } },
        familyMembers: { orderBy: { isPrimaryContact: 'desc' } },
        diagnoses: {
          where:   { resolvedAt: null },
          orderBy: { isPrimary: 'desc' },
          select:  { id: true, icdCode: true, description: true, isPrimary: true, diagnosedAt: true },
        },
      },
    }),
    prisma.vital.findMany({
      where:   { patientId: params.id },
      orderBy: { recordedAt: 'desc' },
      take:    50,
    }),
    prisma.patientMedication.findMany({
      where:   { patientId: params.id },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    }),
    prisma.patientLabResult.findMany({
      where:   { patientId: params.id },
      orderBy: [{ panelDate: 'desc' }, { createdAt: 'desc' }],
      take:    100,
    }),
    prisma.visit.findMany({
      where:   { patientId: params.id },
      orderBy: { scheduledAt: 'desc' },
      take:    50,
      select: {
        id: true, scheduledAt: true, scheduledEnd: true, status: true,
        serviceCode: true, notes: true, nurseNotes: true, providerNotes: true,
        nurse:    { select: { firstName: true, lastName: true } },
        provider: { select: { firstName: true, lastName: true } },
        tasks:    { select: { id: true, status: true } },
      },
    }),
    prisma.carePlanGoal.findMany({
      where:   { patientId: params.id },
      orderBy: [{ status: 'asc' }, { priority: 'asc' }],
    }),
    prisma.cGAAssessment.findFirst({
      where:   { patientId: params.id },
      orderBy: { assessedAt: 'desc' },
      include: { assessedBy: { select: { firstName: true, lastName: true } } },
    }),
    prisma.clinicalAlert.findMany({
      where:   { patientId: params.id, isResolved: false },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    }),
  ])

  if (!patient) notFound()

  // Serialize all non-serializable fields

  const serializedPatient = {
    ...patient,
    dateOfBirth:     patient.dateOfBirth.toISOString(),
    insuranceExpiry: patient.insuranceExpiry?.toISOString() ?? null,
    diagnoses: patient.diagnoses.map(d => ({
      ...d,
      diagnosedAt: d.diagnosedAt?.toISOString() ?? null,
    })),
    familyMembers: patient.familyMembers.map(fm => ({ ...fm })),
  }

  const serializedVitals = vitals.map(v => ({
    id:               v.id,
    recordedAt:       v.recordedAt.toISOString(),
    bloodPressureSys: v.bloodPressureSys ?? null,
    bloodPressureDia: v.bloodPressureDia ?? null,
    heartRate:        v.heartRate        ?? null,
    temperature:      v.temperature      != null ? Number(v.temperature)      : null,
    oxygenSaturation: v.oxygenSaturation != null ? Number(v.oxygenSaturation) : null,
    bloodGlucose:     v.bloodGlucose     != null ? Number(v.bloodGlucose)     : null,
    weight:           v.weight           != null ? Number(v.weight)           : null,
    height:           v.height           != null ? Number(v.height)           : null,
    painScore:        v.painScore        ?? null,
    notes:            v.notes            ?? null,
  }))

  const serializedMeds = medications.map(m => ({
    ...m,
    nameNepali:  m.nameNepali  ?? null,
    dose:        m.dose        ?? null,
    frequency:   m.frequency   ?? null,
    indication:  m.indication  ?? null,
    prescriber:  m.prescriber  ?? null,
    beersNote:   m.beersNote   ?? null,
    notes:       m.notes       ?? null,
    startDate:   m.startDate   ? m.startDate.toISOString().slice(0, 10) : null,
    endDate:     m.endDate     ? m.endDate.toISOString().slice(0, 10)   : null,
  }))

  const serializedLabs = labResults.map(r => ({
    id:           r.id,
    panelDate:    r.panelDate.toISOString().slice(0, 10),
    category:     r.category     ?? null,
    testName:     r.testName,
    result:       r.result,
    unit:         r.unit         ?? null,
    flag:         r.flag         ?? null,
    referenceMin: r.referenceMin != null ? Number(r.referenceMin) : null,
    referenceMax: r.referenceMax != null ? Number(r.referenceMax) : null,
    priorResult:  r.priorResult  ?? null,
    trend:        r.trend        ?? null,
    notes:        r.notes        ?? null,
  }))

  const serializedVisits = visits.map(v => ({
    id:            v.id,
    scheduledAt:   v.scheduledAt.toISOString(),
    scheduledEnd:  v.scheduledEnd.toISOString(),
    status:        v.status,
    serviceCode:   v.serviceCode ?? null,
    visitType:     null as string | null,
    notes:         v.notes         ?? null,
    nurseNotes:    v.nurseNotes    ?? null,
    providerNotes: v.providerNotes ?? null,
    nurse:    v.nurse    ? { firstName: v.nurse.firstName,    lastName: v.nurse.lastName    } : null,
    provider: v.provider ? { firstName: v.provider.firstName, lastName: v.provider.lastName } : null,
    tasks:    v.tasks.map(t => ({ id: t.id, status: t.status })),
  }))

  const serializedGoals = goals.map(g => ({
    id:       g.id,
    goal:     g.goal,
    priority: g.priority === 1 ? 'high' : g.priority === 2 ? 'medium' : 'low',
    status:   g.status,
    detail:   g.detail ?? null,
  }))

  const serializedCGA = cga ? {
    id:              cga.id,
    assessedAt:      cga.assessedAt.toISOString(),
    assessedBy:      { firstName: cga.assessedBy.firstName, lastName: cga.assessedBy.lastName },
    mocaScore:       cga.mocaScore     ?? null,
    gdsScore:        cga.gdsScore      ?? null,
    camPositive:     cga.camPositive   ?? null,
    tugSeconds:      cga.tugSeconds    != null ? Number(cga.tugSeconds) : null,
    fallsLast6m:     cga.fallsLast6m   ?? null,
    adlScore:        cga.adlScore      ?? null,
    iadlScore:       cga.iadlScore     ?? null,
    bmi:             cga.bmi           != null ? Number(cga.bmi) : null,
    primaryGoal:     cga.primaryGoal   ?? null,
    livingSituation: cga.livingSituation ?? null,
    advanceCarePlan: cga.advanceCarePlan ?? null,
    notes:           cga.notes         ?? null,
  } : null

  const serializedAlerts = alerts.map(a => ({
    id:          a.id,
    title:       a.title,
    description: a.description ?? null,
    severity:    a.severity,
    createdAt:   a.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-4">
      <Link
        href="/provider-portal/patients"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700"
      >
        <ChevronLeft className="w-4 h-4" /> My Patients
      </Link>

      <PatientChartPortal
        patient={serializedPatient as never}
        vitals={serializedVitals}
        medications={serializedMeds as never}
        labResults={serializedLabs}
        visits={serializedVisits}
        goals={serializedGoals}
        cga={serializedCGA}
        alerts={serializedAlerts}
      />
    </div>
  )
}
