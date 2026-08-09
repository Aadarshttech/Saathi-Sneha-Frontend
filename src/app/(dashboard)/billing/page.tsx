import type { Metadata } from 'next'
import { Suspense } from 'react'
import BillingClient from './billing-client'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import prisma from '@/lib/prisma'

export const metadata: Metadata = { title: 'Billing' }
export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const orgId      = DEFAULT_ORG_ID
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [
    activeSubscriptions,
    overdueInvoiceCount,
    monthlyRevenue,
    pendingAggregate,
    rawInvoices,
  ] = await Promise.all([
    prisma.patientSubscription.count({
      where: { patient: { orgId }, status: 'active' },
    }),
    prisma.invoice.count({
      where: { orgId, status: 'overdue' },
    }),
    prisma.payment.aggregate({
      where: { invoice: { orgId }, paidAt: { gte: monthStart, lt: monthEnd } },
      _sum:  { amountNpr: true },
    }),
    prisma.invoice.aggregate({
      where: { orgId, status: { in: ['sent', 'partial', 'overdue'] } },
      _sum:  { totalNpr: true, paidNpr: true },
    }),
    prisma.invoice.findMany({
      where:   { orgId },
      include: {
        patient:      { select: { id: true, firstName: true, lastName: true } },
        lineItems:    { orderBy: { id: 'asc' } },
        payments:     { orderBy: { paidAt: 'desc' } },
        subscription: { select: { plan: { select: { name: true, code: true } } } },
      },
      orderBy: { invoiceDate: 'desc' },
      take:    200,
    }),
  ])

  const stats = {
    activeSubscriptions,
    overdueInvoices:    overdueInvoiceCount,
    monthlyRevenueNpr:  Number(monthlyRevenue._sum.amountNpr  ?? 0),
    pendingNpr:         Number(pendingAggregate._sum.totalNpr ?? 0) - Number(pendingAggregate._sum.paidNpr ?? 0),
  }

  const invoices = rawInvoices.map(inv => ({
    id:          inv.id,
    invoiceNo:   inv.invoiceNo,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate:     inv.dueDate.toISOString(),
    status:      inv.status,
    totalNpr:    Number(inv.totalNpr),
    paidNpr:     Number(inv.paidNpr),
    payerType:   inv.payerType,
    planName:    inv.subscription?.plan.name  ?? null,
    planCode:    inv.subscription?.plan.code  ?? null,
    patient: {
      id:        inv.patient.id,
      firstName: inv.patient.firstName,
      lastName:  inv.patient.lastName,
    },
    lineItems: inv.lineItems.map(li => ({
      id:           li.id,
      description:  li.description,
      category:     li.category,
      qty:          li.qty,
      unitPriceNpr: Number(li.unitPriceNpr),
      totalNpr:     Number(li.totalNpr),
    })),
    payments: inv.payments.map(p => ({
      id:        p.id,
      amountNpr: Number(p.amountNpr),
      method:    p.method,
      payerName: p.payerName ?? null,
      paidAt:    p.paidAt.toISOString(),
    })),
  }))

  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading billing…</div>}>
      <BillingClient stats={stats} invoices={invoices} />
    </Suspense>
  )
}
