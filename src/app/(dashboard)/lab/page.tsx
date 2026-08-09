import type { Metadata } from 'next'
import LabClient from './lab-client'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export const metadata: Metadata = { title: 'Lab Results' }
export const dynamic = 'force-dynamic'

export default async function LabPage() {
  const orgId = DEFAULT_ORG_ID

  const [rawPatients, rawVisits, rawResults] = await Promise.all([
    prisma.patient.findMany({
      where:   { orgId, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select:  { id: true, firstName: true, lastName: true },
    }),
    prisma.visit.findMany({
      where:   { orgId },
      orderBy: { scheduledAt: 'desc' },
      take:    300,
      select: {
        id: true, patientId: true, scheduledAt: true,
        serviceCode: true, status: true,
      },
    }),
    prisma.patientLabResult.findMany({
      where:   { patient: { orgId } },
      orderBy: { panelDate: 'desc' },
      take:    500,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        visit:   { select: { id: true, scheduledAt: true, serviceCode: true } },
      },
    }),
  ])

  const patients = rawPatients.map(p => ({
    id: p.id, firstName: p.firstName, lastName: p.lastName,
  }))

  const visits = rawVisits.map(v => ({
    id:          v.id,
    patientId:   v.patientId,
    scheduledAt: v.scheduledAt.toISOString(),
    serviceCode: v.serviceCode ?? null,
    status:      v.status,
  }))

  const initialResults = rawResults.map(r => ({
    id:           r.id,
    patientId:    r.patientId,
    visitId:      r.visitId ?? null,
    panelDate:    r.panelDate.toISOString(),
    category:     r.category ?? null,
    testName:     r.testName,
    result:       r.result,
    unit:         r.unit ?? null,
    referenceMin: r.referenceMin ?? null,
    referenceMax: r.referenceMax ?? null,
    flag:         r.flag ?? null,
    notes:        r.notes ?? null,
    createdAt:    r.createdAt.toISOString(),
    patient: {
      id:        r.patient.id,
      firstName: r.patient.firstName,
      lastName:  r.patient.lastName,
    },
    visit: r.visit ? {
      id:          r.visit.id,
      scheduledAt: r.visit.scheduledAt.toISOString(),
      serviceCode: r.visit.serviceCode ?? null,
    } : null,
  }))

  return <LabClient patients={patients} visits={visits} initialResults={initialResults} />
}
