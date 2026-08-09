import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreateVisitSchema = z.object({
  orgId:       z.string().uuid(),
  branchId:    z.string().uuid().optional(),
  patientId:   z.string().uuid(),
  nurseId:     z.string().uuid().optional(),
  providerId:  z.string().uuid().optional(),
  visitType:   z.string().optional(),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().min(5).max(480).default(60),
  notes:       z.string().optional(),
  tasks: z.array(z.object({
    serviceCode: z.string(),
    notes:       z.string().optional(),
  })).optional(),
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId     = searchParams.get('orgId')
  const nurseId   = searchParams.get('nurseId')
  const patientId = searchParams.get('patientId')
  const status    = searchParams.get('status')
  const date      = searchParams.get('date')
  const page      = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit     = Math.min(100, Number(searchParams.get('limit') ?? 20))
  const skip      = (page - 1) * limit

  if (!orgId || !UUID_RE.test(orgId)) return NextResponse.json({ error: 'orgId must be a valid UUID' }, { status: 400 })
  if (nurseId   && !UUID_RE.test(nurseId))   return NextResponse.json({ error: 'nurseId must be a valid UUID' }, { status: 400 })
  if (patientId && !UUID_RE.test(patientId)) return NextResponse.json({ error: 'patientId must be a valid UUID' }, { status: 400 })

  const where: Record<string, unknown> = { orgId }
  if (nurseId)   where.nurseId   = nurseId
  if (patientId) where.patientId = patientId
  if (status)    where.status    = status
  if (date) {
    const day = new Date(date)
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    where.scheduledAt = { gte: day, lt: next }
  }

  const [total, visits] = await Promise.all([
    prisma.visit.count({ where: where as never }),
    prisma.visit.findMany({
      where: where as never,
      skip,
      take: limit,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, mrn: true, firstName: true, lastName: true, phone: true } },
        nurse:   { select: { id: true, firstName: true, lastName: true } },
        tasks:   { select: { id: true, serviceCode: true, status: true } },
      },
    }),
  ])

  return NextResponse.json({ data: visits, total, page, limit })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateVisitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { tasks, ...visitData } = parsed.data
  const scheduledAt  = new Date(visitData.scheduledAt)
  const scheduledEnd = new Date(scheduledAt.getTime() + (visitData.durationMin ?? 60) * 60_000)

  const visit = await prisma.visit.create({
    data: {
      ...visitData,
      scheduledAt,
      scheduledEnd,
      ...(tasks?.length
        ? { tasks: { create: tasks.map(t => ({ serviceCode: t.serviceCode as never, notes: t.notes })) } }
        : {}),
    },
    include: {
      patient: { select: { id: true, mrn: true, firstName: true, lastName: true } },
      tasks:   true,
    },
  })

  return NextResponse.json({ data: visit }, { status: 201 })
}
