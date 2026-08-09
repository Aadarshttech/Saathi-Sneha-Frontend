import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { patientId, visitId, panelDate, testName, result, category, unit, referenceMin, referenceMax, flag, notes } = body

  if (!patientId?.trim())
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
  if (!panelDate)
    return NextResponse.json({ error: 'panelDate is required' }, { status: 400 })
  if (!testName?.trim())
    return NextResponse.json({ error: 'testName is required' }, { status: 400 })
  if (result == null || String(result).trim() === '')
    return NextResponse.json({ error: 'result is required' }, { status: 400 })

  try {
    const labResult = await prisma.patientLabResult.create({
      data: {
        patientId,
        visitId:      visitId   || null,
        panelDate:    new Date(panelDate),
        testName:     testName.trim(),
        result:       String(result).trim(),
        category:     category?.trim()     || null,
        unit:         unit?.trim()         || null,
        referenceMin: referenceMin?.trim() || null,
        referenceMax: referenceMax?.trim() || null,
        flag:         flag?.trim()         || null,
        notes:        notes?.trim()        || null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        visit:   { select: { id: true, scheduledAt: true, serviceCode: true } },
      },
    })
    return NextResponse.json({ data: labResult }, { status: 201 })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2003')
      return NextResponse.json({ error: 'Patient or visit not found' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create lab result' }, { status: 500 })
  }
}
