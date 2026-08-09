import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, date, reason, isFullDay } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!date)   return NextResponse.json({ error: 'date required (YYYY-MM-DD)' }, { status: 400 })

  try {
    const entry = await prisma.staffTimeOff.upsert({
      where:  { userId_date: { userId, date: new Date(date) } },
      create: { userId, date: new Date(date), reason: reason?.trim() || null, isFullDay: isFullDay ?? true },
      update: { reason: reason?.trim() || null, isFullDay: isFullDay ?? true },
    })
    return NextResponse.json({ data: { ...entry, date: entry.date.toISOString() } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save time off' }, { status: 500 })
  }
}
