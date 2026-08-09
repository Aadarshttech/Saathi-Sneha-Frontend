import { redirect } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ProviderVisitsClient from './provider-visits-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Visits' }

export default async function ProviderVisitsPage({
  searchParams,
}: {
  searchParams: { date?: string; status?: string; all?: string }
}) {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal')

  const showAll = searchParams.all === '1'
  const dateStr = searchParams.date ?? new Date().toISOString().slice(0, 10)
  const status  = searchParams.status ?? ''

  const dayStart = startOfDay(parseISO(dateStr))
  const dayEnd   = endOfDay(parseISO(dateStr))

  const visits = await prisma.visit.findMany({
    where: {
      providerId:  session.userId,
      ...(showAll ? {} : { scheduledAt: { gte: dayStart, lte: dayEnd } }),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { scheduledAt: showAll ? 'desc' : 'asc' },
    take:    showAll ? 200 : undefined,
    select: {
      id: true, scheduledAt: true, scheduledEnd: true,
      status: true, serviceCode: true, notes: true,
      patient: { select: { firstName: true, lastName: true, mrn: true, chronicConditions: true } },
      nurse:   { select: { firstName: true, lastName: true } },
      tasks:   { select: { id: true, status: true } },
    },
  })

  const serialized = visits.map(v => ({
    ...v,
    visitType:    null as string | null,
    scheduledAt:  v.scheduledAt.toISOString(),
    scheduledEnd: v.scheduledEnd.toISOString(),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Visits</h1>
        <Link
          href="/provider-portal/visits/new"
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Visit
        </Link>
      </div>

      <ProviderVisitsClient
        visits={serialized as never}
        date={dateStr}
        status={status}
        showAll={showAll}
      />
    </div>
  )
}
