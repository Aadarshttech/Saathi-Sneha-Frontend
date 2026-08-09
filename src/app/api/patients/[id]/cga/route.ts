import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  assessedById:    z.string().uuid(),
  assessedAt:      z.string(),
  mocaScore:       z.number().int().min(0).max(30).optional(),
  gdsScore:        z.number().int().min(0).max(15).optional(),
  camPositive:     z.boolean().optional(),
  tugSeconds:      z.number().min(0).max(300).optional(),
  fallsLast6m:     z.number().int().min(0).optional(),
  adlScore:        z.number().int().min(0).max(6).optional(),
  iadlScore:       z.number().int().min(0).max(8).optional(),
  homeHazards:     z.number().int().min(0).optional(),
  bpSystolic:      z.number().int().optional(),
  bpDiastolic:     z.number().int().optional(),
  orthoDropMmhg:   z.number().int().optional(),
  bmi:             z.number().min(10).max(70).optional(),
  primaryGoal:     z.string().optional(),
  livingSituation: z.string().optional(),
  advanceCarePlan: z.enum(['documented', 'to_discuss', 'declined']).optional(),
  mnaNutrition:    z.number().int().min(0).max(14).optional(),
  visionNotes:     z.string().optional(),
  hearingNotes:    z.string().optional(),
  continenceNotes: z.string().optional(),
  labScreeningItems: z.array(z.string()).optional(),
  notes:           z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const assessments = await prisma.cGAAssessment.findMany({
    where: { patientId: params.id },
    include: { assessedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { assessedAt: 'desc' },
    take: 10,
  })
  return NextResponse.json({ data: assessments })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const cga = await prisma.cGAAssessment.create({
    data: {
      patientId: params.id,
      ...parsed.data,
      assessedAt: new Date(parsed.data.assessedAt),
      tugSeconds: parsed.data.tugSeconds != null ? parsed.data.tugSeconds : undefined,
      bmi:        parsed.data.bmi        != null ? parsed.data.bmi        : undefined,
    },
    include: { assessedBy: { select: { firstName: true, lastName: true } } },
  })
  return NextResponse.json({ data: cga }, { status: 201 })
}
