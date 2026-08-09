import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Upsert a single day's availability for a staff member
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, dayOfWeek, startTime, endTime, isActive } = body

  if (!userId)                          return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (dayOfWeek == null)                return NextResponse.json({ error: 'dayOfWeek required (0–6)' }, { status: 400 })
  if (!startTime || !endTime)           return NextResponse.json({ error: 'startTime and endTime required' }, { status: 400 })

  const slot = await prisma.staffAvailability.upsert({
    where:  { userId_dayOfWeek: { userId, dayOfWeek } },
    create: { userId, dayOfWeek, startTime, endTime, isActive: isActive ?? true },
    update: { startTime, endTime, isActive: isActive ?? true },
  })

  return NextResponse.json({ data: slot })
}
