import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  panelDate:    z.string(),
  category:     z.string().optional(),
  testName:     z.string().min(1),
  result:       z.string().min(1),
  unit:         z.string().optional(),
  referenceMin: z.string().optional(),
  referenceMax: z.string().optional(),
  flag:         z.enum(['normal', 'high', 'low', 'critical']).optional(),
  priorResult:  z.string().optional(),
  trend:        z.enum(['improving', 'worsening', 'stable']).optional(),
  notes:        z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const labs = await prisma.patientLabResult.findMany({
    where: { patientId: params.id },
    orderBy: [{ panelDate: 'desc' }, { testName: 'asc' }],
  })
  return NextResponse.json({ data: labs })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const lab = await prisma.patientLabResult.create({
    data: {
      patientId: params.id,
      ...parsed.data,
      panelDate: new Date(parsed.data.panelDate),
    },
  })
  return NextResponse.json({ data: lab }, { status: 201 })
}
