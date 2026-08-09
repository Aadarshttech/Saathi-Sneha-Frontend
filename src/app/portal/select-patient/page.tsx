import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import PatientPicker from '../patient-picker'

function calcAge(dob: Date): number {
  const diff = Date.now() - dob.getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

export default async function SelectPatientPage() {
  const session = getPortalSession()
  if (!session) redirect('/portal/login')

  const patients = await prisma.patient.findMany({
    where:  { caregiverAccountId: session.caregiverAccountId, orgId: DEFAULT_ORG_ID, isActive: true },
    select: {
      id: true, firstName: true, lastName: true, firstNameNepali: true, mrn: true,
      dateOfBirth: true, gender: true, chronicConditions: true,
      primaryNurse: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (patients.length === 0) redirect('/portal/onboarding')

  const rows = patients.map(p => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    firstNameNepali: p.firstNameNepali,
    mrn: p.mrn,
    age: calcAge(p.dateOfBirth),
    gender: p.gender,
    chronicConditions: p.chronicConditions,
    nurseName: p.primaryNurse ? `${p.primaryNurse.firstName} ${p.primaryNurse.lastName}` : null,
  }))

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Who are you caring for?</h1>
          <p className="text-sm text-gray-500 mt-1">Select a parent to view their care dashboard.</p>
        </div>
        <PatientPicker patients={rows} />
      </div>
    </div>
  )
}
