import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  try {
    const labResult = await prisma.patientLabResult.update({
      where: { id: params.id },
      data: {
        ...(body.visitId      !== undefined && { visitId:      body.visitId || null }),
        ...(body.panelDate    != null && { panelDate:    new Date(body.panelDate) }),
        ...(body.testName     != null && { testName:     String(body.testName).trim() }),
        ...(body.result       != null && { result:       String(body.result).trim() }),
        ...(body.category     !== undefined && { category:     body.category?.trim() || null }),
        ...(body.unit         !== undefined && { unit:         body.unit?.trim()     || null }),
        ...(body.referenceMin !== undefined && { referenceMin: body.referenceMin?.trim() || null }),
        ...(body.referenceMax !== undefined && { referenceMax: body.referenceMax?.trim() || null }),
        ...(body.flag         !== undefined && { flag:         body.flag?.trim()     || null }),
        ...(body.notes        !== undefined && { notes:        body.notes?.trim()    || null }),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        visit:   { select: { id: true, scheduledAt: true, serviceCode: true } },
      },
    })
    return NextResponse.json({ data: labResult })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2025')
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update lab result' }, { status: 500 })
  }
}
