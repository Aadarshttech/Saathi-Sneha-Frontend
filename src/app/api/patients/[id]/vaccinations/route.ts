import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  vaccineName: z.string().min(1),
  givenDate:   z.string().optional(),
  nextDueDate: z.string().optional(),
  status:      z.enum(['up_to_date', 'due', 'overdue']).default('due'),
  notes:       z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const vaccinations = await prisma.patientVaccination.findMany({
    where: { patientId: params.id },
    orderBy: { vaccineName: 'asc' },
  })
  return NextResponse.json({ data: vaccinations })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const vax = await prisma.patientVaccination.create({
    data: {
      patientId: params.id,
      ...parsed.data,
      givenDate:   parsed.data.givenDate   ? new Date(parsed.data.givenDate)   : undefined,
      nextDueDate: parsed.data.nextDueDate ? new Date(parsed.data.nextDueDate) : undefined,
    },
  })
  return NextResponse.json({ data: vax }, { status: 201 })
}
