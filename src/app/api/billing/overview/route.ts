import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [
    activeSubscriptions,
    overdueInvoices,
    monthlyRevenue,
    recentInvoices,
    planBreakdown,
  ] = await Promise.all([
    prisma.patientSubscription.count({
      where: { patient: { orgId }, status: 'active' },
    }),
    prisma.invoice.count({
      where: { orgId, status: 'overdue' },
    }),
    prisma.payment.aggregate({
      where: {
        invoice: { orgId },
        paidAt:  { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountNpr: true },
    }),
    prisma.invoice.findMany({
      where:   { orgId },
      include: {
        patient:  { select: { id: true, firstName: true, lastName: true, mrn: true } },
        payments: { select: { amountNpr: true }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.patientSubscription.groupBy({
      by:    ['planId'],
      where: { patient: { orgId }, status: 'active' },
      _count: { id: true },
      _sum:   { priceNpr: true },
    }),
  ])

  // Enrich plan breakdown with plan names
  const planIds  = planBreakdown.map(p => p.planId)
  const plans    = await prisma.subscriptionPlan.findMany({ where: { id: { in: planIds } } })
  const planMap  = Object.fromEntries(plans.map(p => [p.id, p]))

  const enrichedBreakdown = planBreakdown.map(p => ({
    planId:   p.planId,
    planName: planMap[p.planId]?.name ?? 'Unknown',
    planCode: planMap[p.planId]?.code ?? '',
    count:    p._count.id,
    revenueNpr: p._sum.priceNpr ?? 0,
  }))

  return NextResponse.json({
    data: {
      activeSubscriptions,
      overdueInvoices,
      monthlyRevenueNpr: monthlyRevenue._sum.amountNpr ?? 0,
      recentInvoices,
      planBreakdown: enrichedBreakdown,
    },
  })
}
