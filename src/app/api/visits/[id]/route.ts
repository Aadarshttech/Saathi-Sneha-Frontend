import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateVisitSchema = z.object({
  status:       z.enum(['requested','scheduled','en_route','checked_in','in_progress','completed','cancelled','missed']).optional(),
  nurseId:      z.string().uuid().optional(),
  providerId:   z.string().uuid().optional(),
  scheduledAt:  z.string().datetime().optional(),
  checkedInAt:  z.string().datetime().optional(),
  completedAt:  z.string().datetime().optional(),
  durationMin:  z.number().int().optional(),
  notes:        z.string().optional(),
  nurseNotes:   z.string().optional(),
  providerNotes: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const visit = await prisma.visit.findUnique({
    where: { id: params.id },
    include: {
      patient:  { select: { id: true, mrn: true, firstName: true, lastName: true, dateOfBirth: true, phone: true, bloodGroup: true } },
      nurse:    { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      tasks:    true,
      vitals:   { orderBy: { recordedAt: 'desc' } },
    },
  })

  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  return NextResponse.json({ data: visit })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = UpdateVisitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data

  // scheduledEnd is derived from scheduledAt + durationMin, but isn't itself an
  // editable field — recompute it whenever either input changes, using the
  // visit's existing values as the fallback for whichever one didn't change.
  let scheduledEnd: Date | undefined
  if (data.scheduledAt || data.durationMin != null) {
    const current = await prisma.visit.findUnique({
      where: { id: params.id },
      select: { scheduledAt: true, durationMin: true },
    })
    if (!current) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    const start = data.scheduledAt ? new Date(data.scheduledAt) : current.scheduledAt
    const duration = data.durationMin ?? current.durationMin
    scheduledEnd = new Date(start.getTime() + duration * 60_000)
  }

  const visit = await prisma.visit.update({
    where: { id: params.id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      scheduledEnd,
      checkedInAt: data.checkedInAt ? new Date(data.checkedInAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    } as never,
  })

  return NextResponse.json({ data: visit })
}
