import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const VitalsSchema = z.object({
  recordedById:     z.string().uuid().optional(),
  bloodPressureSys: z.number().int().min(40).max(300).optional(),
  bloodPressureDia: z.number().int().min(20).max(200).optional(),
  heartRate:        z.number().int().min(10).max(300).optional(),
  respiratoryRate:  z.number().int().min(4).max(60).optional(),
  temperature:      z.number().min(28).max(45).optional(),
  oxygenSaturation: z.number().min(40).max(100).optional(),
  weight:           z.number().min(1).max(500).optional(),
  height:           z.number().min(30).max(250).optional(),
  bloodGlucose:     z.number().min(1).max(800).optional(),
  painScore:        z.number().int().min(0).max(10).optional(),
  notes:            z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = VitalsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const visit = await prisma.visit.findUnique({
    where: { id: params.id },
    select: { patientId: true, nurseId: true, providerId: true },
  })
  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  // Fall back to nurse → provider → any active user in the org
  let recordedById = parsed.data.recordedById ?? visit.nurseId ?? visit.providerId
  if (!recordedById) {
    const fallback = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } })
    recordedById = fallback?.id ?? null
  }
  if (!recordedById) {
    return NextResponse.json({ error: 'No user found to record vitals' }, { status: 422 })
  }

  const { recordedById: _, ...vitalsData } = parsed.data

  const vitals = await prisma.vital.create({
    data: {
      visitId:     params.id,
      patientId:   visit.patientId,
      recordedById,
      ...vitalsData,
    } as never,
  })

  return NextResponse.json({ data: vitals }, { status: 201 })
}
