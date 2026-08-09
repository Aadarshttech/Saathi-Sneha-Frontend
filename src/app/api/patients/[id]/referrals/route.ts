import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  specialty:       z.string().min(1),
  reason:          z.string().min(1),
  provider:        z.string().optional(),
  referralDate:    z.string(),
  appointmentDate: z.string().optional(),
  status:          z.enum(['pending', 'scheduled', 'completed', 'cancelled']).default('pending'),
  notes:           z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const referrals = await prisma.patientReferral.findMany({
    where: { patientId: params.id },
    orderBy: { referralDate: 'desc' },
  })
  return NextResponse.json({ data: referrals })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const referral = await prisma.patientReferral.create({
    data: {
      patientId: params.id,
      ...parsed.data,
      referralDate:    new Date(parsed.data.referralDate),
      appointmentDate: parsed.data.appointmentDate ? new Date(parsed.data.appointmentDate) : undefined,
    },
  })
  return NextResponse.json({ data: referral }, { status: 201 })
}
