import { redirect } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import prisma from '@/lib/prisma'
import { differenceInYears } from 'date-fns'
import { Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Patients' }

export default async function ProviderPatientsPage() {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal')

  const patients = await prisma.patient.findMany({
    where:   { primaryDoctorId: session.userId, isActive: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true, firstName: true, lastName: true, firstNameNepali: true, lastNameNepali: true,
      mrn: true, dateOfBirth: true, gender: true, phone: true,
      chronicConditions: true, bloodGroup: true,
      primaryNurse: { select: { firstName: true, lastName: true } },
      visits: {
        orderBy: { scheduledAt: 'desc' },
        take:    1,
        select:  { scheduledAt: true, status: true },
      },
      _count: { select: { visits: true, medications: { where: { isActive: true } }, labResults: true } },
    },
  })

  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Patients</h1>
        <span className="text-sm text-gray-500">{patients.length} active</span>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No patients assigned</p>
          <p className="text-sm mt-1">Patients with you as their primary doctor will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map(p => {
            const age      = differenceInYears(now, new Date(p.dateOfBirth))
            const lastVisit = p.visits[0]
            return (
              <Link key={p.id} href={`/provider-portal/patients/${p.id}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {p.firstName} {p.lastName}
                      </p>
                      {(p.firstNameNepali || p.lastNameNepali) && (
                        <span className="text-sm text-gray-400">
                          {p.firstNameNepali} {p.lastNameNepali}
                        </span>
                      )}
                      {p.bloodGroup && (
                        <span className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded-full font-medium border border-red-100">
                          {p.bloodGroup}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {age}y {p.gender ? `· ${p.gender}` : ''} · MRN: {p.mrn}
                      {p.phone ? ` · ${p.phone}` : ''}
                    </p>
                  </div>
                </div>

                {p.chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {p.chronicConditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  {p.primaryNurse && (
                    <span>Nurse: {p.primaryNurse.firstName} {p.primaryNurse.lastName}</span>
                  )}
                  <span className="flex items-center gap-3">
                    <span>{p._count.visits} visits</span>
                    <span>{p._count.medications} meds</span>
                    <span>{p._count.labResults} labs</span>
                  </span>
                  {lastVisit && (
                    <span>Last: {new Date(lastVisit.scheduledAt).toLocaleDateString()}</span>
                  )}
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
