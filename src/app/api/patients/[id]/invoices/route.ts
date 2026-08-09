import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { DEFAULT_ORG_ID } from '@/lib/constants'

const LineItemSchema = z.object({
  description:  z.string().min(1),
  category:     z.string().default('other'),
  qty:          z.number().int().min(1).default(1),
  unitPriceNpr: z.number().int().min(0),
  visitId:      z.string().uuid().optional(),
})

const Schema = z.object({
  subscriptionId: z.string().uuid().optional(),
  invoiceDate:    z.string(),
  dueDate:        z.string(),
  payerType:      z.enum(['family_overseas', 'patient_local']).default('family_overseas'),
  notes:          z.string().optional(),
  discountNpr:    z.number().int().min(0).default(0),
  taxNpr:         z.number().int().min(0).default(0),
  lineItems:      z.array(LineItemSchema).min(1),
})

async function generateInvoiceNo(): Promise<string> {
  const now   = new Date()
  const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const count = await prisma.invoice.count({
    where: { invoiceNo: { startsWith: `INV-${ym}-` } },
  })
  return `INV-${ym}-${String(count + 1).padStart(4, '0')}`
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const invoices = await prisma.invoice.findMany({
    where: { patientId: params.id, ...(status ? { status: status as never } : {}) },
    include: {
      lineItems: true,
      payments:  { orderBy: { paidAt: 'desc' } },
      subscription: { select: { plan: { select: { name: true, code: true } } } },
    },
    orderBy: { invoiceDate: 'desc' },
    take: 50,
  })
  return NextResponse.json({ data: invoices })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { lineItems, discountNpr, taxNpr, ...invoiceData } = parsed.data
  const subtotalNpr = lineItems.reduce((s, l) => s + l.unitPriceNpr * l.qty, 0)
  const totalNpr    = subtotalNpr - discountNpr + taxNpr
  const invoiceNo   = await generateInvoiceNo()

  const invoice = await prisma.invoice.create({
    data: {
      orgId:       DEFAULT_ORG_ID,
      patientId:   params.id,
      invoiceNo,
      subtotalNpr,
      discountNpr,
      taxNpr,
      totalNpr,
      paidNpr: 0,
      ...invoiceData,
      invoiceDate: new Date(invoiceData.invoiceDate),
      dueDate:     new Date(invoiceData.dueDate),
      lineItems: {
        create: lineItems.map(l => ({
          ...l,
          totalNpr: l.unitPriceNpr * l.qty,
        })),
      },
    },
    include: {
      lineItems: true,
      payments:  true,
    },
  })
  return NextResponse.json({ data: invoice }, { status: 201 })
}
