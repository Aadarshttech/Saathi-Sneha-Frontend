import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  name:           z.string().min(1),
  nameNepali:     z.string().optional(),
  dose:           z.string().optional(),
  frequency:      z.string().optional(),
  indication:     z.string().optional(),
  prescriber:     z.string().optional(),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
  isActive:       z.boolean().default(true),
  isBeersFlagged: z.boolean().default(false),
  beersNote:      z.string().optional(),
  status:         z.enum(['active', 'discontinued', 'prn', 'deprescribe']).default('active'),
  notes:          z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const meds = await prisma.patientMedication.findMany({
    where: { patientId: params.id },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ data: meds })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const med = await prisma.patientMedication.create({
    data: {
      patientId: params.id,
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate:   parsed.data.endDate   ? new Date(parsed.data.endDate)   : undefined,
    },
  })
  return NextResponse.json({ data: med }, { status: 201 })
}
