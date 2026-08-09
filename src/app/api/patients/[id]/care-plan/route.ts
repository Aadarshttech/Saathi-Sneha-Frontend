import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  goal:     z.string().min(1),
  detail:   z.string().optional(),
  status:   z.enum(['active', 'achieved', 'on_hold', 'discontinued']).default('active'),
  priority: z.number().int().default(0),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const goals = await prisma.carePlanGoal.findMany({
    where: { patientId: params.id },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ data: goals })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const goal = await prisma.carePlanGoal.create({
    data: { patientId: params.id, ...parsed.data },
  })
  return NextResponse.json({ data: goal }, { status: 201 })
}
