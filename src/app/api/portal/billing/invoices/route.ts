import { NextResponse } from 'next/server'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = getPortalSession()
  if (!session || !session.patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where:   { patientId: session.patientId },
    orderBy: { invoiceDate: 'desc' },
    include: { subscription: { include: { plan: { select: { name: true } } } } },
  })

  return NextResponse.json({
    invoices: invoices.map(inv => ({
      id:          inv.id,
      invoiceNo:   inv.invoiceNo,
      invoiceDate: inv.invoiceDate.toISOString().slice(0, 10),
      dueDate:     inv.dueDate.toISOString().slice(0, 10),
      status:      inv.status,
      totalNpr:    inv.totalNpr,
      paidNpr:     inv.paidNpr,
      planName:    inv.subscription?.plan?.name ?? null,
    })),
  })
}
