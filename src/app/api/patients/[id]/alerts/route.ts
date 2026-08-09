import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  severity:    z.enum(['critical', 'warn', 'info']).default('warn'),
  title:       z.string().min(1),
  description: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const alerts = await prisma.clinicalAlert.findMany({
    where: { patientId: params.id, isResolved: false },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ data: alerts })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const alert = await prisma.clinicalAlert.create({
    data: { patientId: params.id, ...parsed.data },
  })
  return NextResponse.json({ data: alert }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  if (!body.alertId) return NextResponse.json({ error: 'alertId required' }, { status: 400 })

  const alert = await prisma.clinicalAlert.update({
    where: { id: body.alertId, patientId: params.id },
    data: { isResolved: true, resolvedAt: new Date() },
  })
  return NextResponse.json({ data: alert })
}
