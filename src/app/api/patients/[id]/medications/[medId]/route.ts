import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  name:           z.string().min(1).optional(),
  nameNepali:     z.string().optional(),
  dose:           z.string().optional(),
  frequency:      z.string().optional(),
  indication:     z.string().optional(),
  prescriber:     z.string().optional(),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
  isActive:       z.boolean().optional(),
  isBeersFlagged: z.boolean().optional(),
  beersNote:      z.string().optional(),
  status:         z.enum(['active', 'discontinued', 'prn', 'deprescribe']).optional(),
  notes:          z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string; medId: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const existing = await prisma.patientMedication.findUnique({ where: { id: params.medId } })
  if (!existing || existing.patientId !== params.id) {
    return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
  }

  const med = await prisma.patientMedication.update({
    where: { id: params.medId },
    data: {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate:   parsed.data.endDate   ? new Date(parsed.data.endDate)   : undefined,
    },
  })
  return NextResponse.json({ data: med })
}
