import { redirect } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ScheduleVisitFormPortal from './schedule-visit-form-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Schedule Visit' }

export default async function ProviderNewVisitPage() {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal')

  const [patients, nurses, services] = await Promise.all([
    prisma.patient.findMany({
      where:   { orgId: DEFAULT_ORG_ID, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select:  { id: true, mrn: true, firstName: true, lastName: true },
    }),
    prisma.user.findMany({
      where:   { orgId: DEFAULT_ORG_ID, role: 'nurse' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select:  { id: true, firstName: true, lastName: true },
    }),
    prisma.serviceCatalog.findMany({
      orderBy: { nameEn: 'asc' },
      select:  { code: true, nameEn: true, category: true },
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/provider-portal/visits"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> My Visits
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Schedule New Visit</h1>
      </div>

      <ScheduleVisitFormPortal
        providerId={session.userId}
        providerName={`Dr. ${session.firstName} ${session.lastName}`}
        patients={patients}
        nurses={nurses}
        services={services.map(s => ({ code: s.code, nameEn: s.nameEn, category: s.category }))}
      />
    </div>
  )
}
