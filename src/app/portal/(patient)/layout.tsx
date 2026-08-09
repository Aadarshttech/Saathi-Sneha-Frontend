import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import PortalNav from '@/components/portal/portal-nav'

export default async function PatientAreaLayout({ children }: { children: React.ReactNode }) {
  const session = getPortalSession()
  if (!session) redirect('/portal/login')

  const patients = await prisma.patient.findMany({
    where:   { caregiverAccountId: session.caregiverAccountId, orgId: DEFAULT_ORG_ID, isActive: true },
    select:  { id: true, firstName: true, lastName: true },
    orderBy: { createdAt: 'asc' },
  })

  const hasValidSelection = session.patientId && patients.some(p => p.id === session.patientId)
  if (!hasValidSelection) {
    redirect(patients.length > 0 ? '/portal/select-patient' : '/portal/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav
        firstName={session.firstName}
        lastName={session.lastName}
        patients={patients}
        currentPatientId={session.patientId}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
