import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CompleteVisitSchema = z.object({
  nurseNotes:    z.string().optional(),
  providerNotes: z.string().optional(),
  taskUpdates: z.array(z.object({
    taskId: z.string().uuid(),
    status: z.enum(['pending','in_progress','completed','skipped']),
    notes:  z.string().optional(),
  })).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = CompleteVisitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { nurseNotes, providerNotes, taskUpdates } = parsed.data

  const visit = await prisma.$transaction(async (tx) => {
    if (taskUpdates?.length) {
      await Promise.all(
        taskUpdates.map(t =>
          tx.visitTask.update({
            where: { id: t.taskId },
            data:  { status: t.status as never, notes: t.notes, completedAt: t.status === 'completed' ? new Date() : undefined },
          })
        )
      )
    }

    return tx.visit.update({
      where: { id: params.id },
      data: {
        status:      'completed' as never,
        completedAt: new Date(),
        nurseNotes,
        providerNotes,
      },
    })
  })

  return NextResponse.json({ data: visit })
}
