import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  amountNpr:   z.number().int().min(1),
  method:      z.enum(['cash', 'bank_transfer', 'esewa', 'khalti', 'stripe', 'cheque']),
  payerType:   z.enum(['family_overseas', 'patient_local']),
  payerName:   z.string().optional(),
  referenceNo: z.string().optional(),
  paidAt:      z.string().optional(),
  notes:       z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const payment = await prisma.payment.create({
    data: {
      invoiceId: params.id,
      ...parsed.data,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
    },
  })

  // Update invoice paid amount and status
  const newPaid  = invoice.paidNpr + parsed.data.amountNpr
  const newStatus =
    newPaid >= invoice.totalNpr ? 'paid' :
    newPaid > 0                 ? 'partial' :
    invoice.status

  await prisma.invoice.update({
    where: { id: params.id },
    data:  { paidNpr: newPaid, status: newStatus as never },
  })

  return NextResponse.json({ data: payment }, { status: 201 })
}
