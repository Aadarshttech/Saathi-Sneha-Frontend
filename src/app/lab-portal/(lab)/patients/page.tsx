import { redirect } from 'next/navigation'
import { getLabSession } from '@/lib/lab-portal-auth'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { differenceInYears } from 'date-fns'
import { Users, FlaskConical } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Patients' }

const FLAG_STYLES: Record<string, string> = {
  normal:   'bg-green-100 text-green-700',
  high:     'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700',
}

export default async function LabPatientsPage() {
  const session = getLabSession()
  if (!session) redirect('/lab-portal')

  const patients = await prisma.patient.findMany({
    where:   { orgId: DEFAULT_ORG_ID, isActive: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true, firstName: true, lastName: true, mrn: true,
      dateOfBirth: true, gender: true, phone: true,
      labResults: {
        orderBy: { panelDate: 'desc' },
        take:    1,
        select:  { panelDate: true, flag: true, testName: true },
      },
      _count: { select: { labResults: true } },
    },
  })

  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Patients</h1>
        <span className="text-sm text-gray-500">{patients.length} active</span>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No patients found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {patients.map(p => {
            const age       = differenceInYears(now, new Date(p.dateOfBirth))
            const latestLab = p.labResults[0]
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {age}y {p.gender ? `· ${p.gender}` : ''} · MRN: {p.mrn}
                  </p>
                  {latestLab && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last: {latestLab.testName} · {new Date(latestLab.panelDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-semibold text-gray-700">{p._count.labResults}</span>
                  </div>
                  <p className="text-xs text-gray-400">labs</p>
                  {latestLab?.flag && latestLab.flag !== 'normal' && (
                    <span className={`mt-1 inline-block px-1.5 py-0.5 text-xs rounded font-medium ${FLAG_STYLES[latestLab.flag] ?? 'bg-gray-100 text-gray-500'}`}>
                      {latestLab.flag.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
