import { redirect } from 'next/navigation'
import { getLabSession } from '@/lib/lab-portal-auth'
import prisma from '@/lib/prisma'
import { format, startOfDay } from 'date-fns'
import { FlaskConical, AlertTriangle, TrendingUp, Users, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const FLAG_STYLES: Record<string, string> = {
  normal:   'bg-green-100 text-green-700',
  high:     'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
  critical: 'bg-red-100 text-red-700',
  pending:  'bg-gray-100 text-gray-500',
}

const CATEGORY_LABELS: Record<string, string> = {
  metabolic:    'Metabolic',
  blood_count:  'Blood Count',
  lipids:       'Lipids',
  vitamins:     'Vitamins',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function LabDashboardPage() {
  const session = getLabSession()
  if (!session) redirect('/lab-portal')

  const now = new Date()

  const [labTech, recentResults, totalCount, criticalCount, todayCount, patientCount] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session.userId },
      select: { firstName: true, lastName: true, branch: { select: { name: true } } },
    }),
    prisma.patientLabResult.findMany({
      orderBy: [{ panelDate: 'desc' }, { createdAt: 'desc' }],
      take:    10,
      select: {
        id: true, testName: true, result: true, unit: true, flag: true,
        category: true, panelDate: true,
        patient: { select: { firstName: true, lastName: true, mrn: true } },
      },
    }),
    prisma.patientLabResult.count(),
    prisma.patientLabResult.count({ where: { flag: 'critical' } }),
    prisma.patientLabResult.count({ where: { panelDate: { gte: startOfDay(now) } } }),
    prisma.patient.count({ where: { labResults: { some: {} }, isActive: true } }),
  ])

  if (!labTech) redirect('/lab-portal')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting()}, {labTech.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(now, 'EEEE, MMMM d, yyyy')}
            {labTech.branch && <> · {labTech.branch.name}</>}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {labTech.firstName[0]}{labTech.lastName[0]}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-500 font-medium">Total Results</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-xs text-gray-400">all time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Critical Flags</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-xs text-gray-400">need attention</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-500 font-medium">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
          <p className="text-xs text-gray-400">results entered</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-500 font-medium">Patients</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{patientCount}</p>
          <p className="text-xs text-gray-400">with lab records</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/lab-portal/results"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enter Lab Result
        </Link>
        <Link
          href="/lab-portal/patients"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Users className="w-4 h-4" />
          Browse Patients
        </Link>
      </div>

      {/* Recent results */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Recent Lab Results</h2>
          <Link href="/lab-portal/results" className="text-xs text-emerald-600 hover:underline">View all →</Link>
        </div>
        {recentResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No lab results yet</p>
            <Link href="/lab-portal/results" className="text-xs text-emerald-600 hover:underline mt-1 inline-block">
              Enter the first result →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentResults.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                <div className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${FLAG_STYLES[r.flag ?? 'pending'] ?? 'bg-gray-100 text-gray-500'}`}>
                  {(r.flag ?? 'pending').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.testName}</p>
                  <p className="text-xs text-gray-500">
                    {r.patient.firstName} {r.patient.lastName} · {r.patient.mrn}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {r.result}{r.unit ? <span className="text-xs text-gray-400 ml-0.5">{r.unit}</span> : null}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(r.panelDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
