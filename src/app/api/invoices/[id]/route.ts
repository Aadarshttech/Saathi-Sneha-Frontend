import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      patient:      { select: { id: true, mrn: true, firstName: true, lastName: true, phone: true } },
      subscription: { include: { plan: true } },
      lineItems:    true,
      payments:     { orderBy: { paidAt: 'desc' } },
    },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: invoice })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data:  { status: body.status, notes: body.notes },
  })
  return NextResponse.json({ data: invoice })
}
