import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getPortalSession } from '@/lib/portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

const SERVICE_CODES = [
  'wellness_check', 'chronic_disease_monitoring', 'medication_management', 'doctor_consultation',
  'lab_coordination', 'physiotherapy', 'post_hospital_care', 'hospital_escort', 'caregiver_support',
  'mental_wellness_check', 'urgent_nurse_visit', 'doctor_on_call', 'ambulance_coordination',
  'hospital_admission_support', 'medicine_delivery', 'family_video_update',
] as const

const RequestVisitSchema = z.object({
  scheduledAt: z.string().datetime(),
  serviceCode: z.enum(SERVICE_CODES),
  notes:       z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  const session = getPortalSession()
  if (!session || !session.patientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = RequestVisitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { scheduledAt, serviceCode, notes } = parsed.data
  const start = new Date(scheduledAt)
  if (start.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Please choose a future date and time.' }, { status: 400 })
  }
  const end = new Date(start.getTime() + 60 * 60_000)

  try {
    const visit = await prisma.visit.create({
      data: {
        orgId:       DEFAULT_ORG_ID,
        patientId:   session.patientId,
        serviceCode,
        scheduledAt: start,
        scheduledEnd: end,
        status:      'requested',
        notes:       `Requested via family portal.${notes ? ` ${notes}` : ''}`,
        tasks: { create: [{ serviceCode: serviceCode as never }] },
      },
      select: { id: true },
    })
    return NextResponse.json({ ok: true, visitId: visit.id }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/portal/visits/request]', message)
    return NextResponse.json({ error: 'Failed to submit visit request' }, { status: 500 })
  }
}
