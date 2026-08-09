import { redirect } from 'next/navigation'
import { getLabSession } from '@/lib/lab-portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import prisma from '@/lib/prisma'
import LabResultsClient from './results-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lab Results' }

export default async function LabResultsPage() {
  const session = getLabSession()
  if (!session) redirect('/lab-portal')

  const [patients, results] = await Promise.all([
    prisma.patient.findMany({
      where:   { orgId: DEFAULT_ORG_ID, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select:  { id: true, firstName: true, lastName: true, mrn: true },
    }),
    prisma.patientLabResult.findMany({
      orderBy: [{ panelDate: 'desc' }, { createdAt: 'desc' }],
      take:    200,
      select: {
        id: true, testName: true, result: true, unit: true,
        flag: true, category: true, panelDate: true, notes: true,
        patient: { select: { firstName: true, lastName: true, mrn: true } },
      },
    }),
  ])

  const serializedResults = results.map(r => ({
    ...r,
    panelDate: r.panelDate.toISOString().slice(0, 10),
    unit:      r.unit     ?? null,
    flag:      r.flag     ?? null,
    category:  r.category ?? null,
    notes:     r.notes    ?? null,
  }))

  return <LabResultsClient patients={patients} initialResults={serializedResults} />
}
