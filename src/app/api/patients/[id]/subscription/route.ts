import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  planId:      z.string().uuid(),
  priceNpr:    z.number().int().min(0),
  startDate:   z.string(),
  endDate:     z.string().optional(),
  renewalDate: z.string().optional(),
  payerType:   z.enum(['family_overseas', 'patient_local']).default('family_overseas'),
  payerName:   z.string().optional(),
  payerPhone:  z.string().optional(),
  notes:       z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sub = await prisma.patientSubscription.findFirst({
    where:   { patientId: params.id, status: { in: ['active', 'trial', 'paused'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })
  const history = await prisma.patientSubscription.findMany({
    where:   { patientId: params.id },
    include: { plan: { select: { name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json({ data: sub, history })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // Cancel any existing active subscription first
  await prisma.patientSubscription.updateMany({
    where: { patientId: params.id, status: { in: ['active', 'trial'] } },
    data:  { status: 'cancelled', endDate: new Date() },
  })

  const sub = await prisma.patientSubscription.create({
    data: {
      patientId: params.id,
      ...parsed.data,
      startDate:   new Date(parsed.data.startDate),
      endDate:     parsed.data.endDate     ? new Date(parsed.data.endDate)     : undefined,
      renewalDate: parsed.data.renewalDate ? new Date(parsed.data.renewalDate) : undefined,
    },
    include: { plan: true },
  })
  return NextResponse.json({ data: sub }, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { subId, ...rest } = body
  if (!subId) return NextResponse.json({ error: 'subId required' }, { status: 400 })

  const parsed = Schema.partial().safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const sub = await prisma.patientSubscription.update({
    where:   { id: subId, patientId: params.id },
    data: {
      ...parsed.data,
      startDate:   parsed.data.startDate   ? new Date(parsed.data.startDate)   : undefined,
      endDate:     parsed.data.endDate     ? new Date(parsed.data.endDate)     : undefined,
      renewalDate: parsed.data.renewalDate ? new Date(parsed.data.renewalDate) : undefined,
    },
    include: { plan: true },
  })
  return NextResponse.json({ data: sub })
}
