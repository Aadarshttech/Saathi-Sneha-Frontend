import { redirect } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import prisma from '@/lib/prisma'
import { format, differenceInYears, startOfDay, endOfDay } from 'date-fns'
import { Stethoscope, Users, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const STATUS_STYLES: Record<string, string> = {
  scheduled:   'bg-blue-100 text-blue-700',
  en_route:    'bg-yellow-100 text-yellow-700',
  checked_in:  'bg-purple-100 text-purple-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
  missed:      'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled:   'Scheduled',
  en_route:    'On the way',
  checked_in:  'Arrived',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  missed:      'Missed',
}

const SERVICE_LABELS: Record<string, string> = {
  wellness_check:             'Wellness Check',
  chronic_disease_monitoring: 'Chronic Disease Monitoring',
  medication_management:      'Medication Management',
  doctor_consultation:        'Doctor Consultation',
  lab_coordination:           'Lab Coordination',
  physiotherapy:              'Physiotherapy',
  post_hospital_care:         'Post-Hospital Care',
  doctor_on_call:             'Doctor On Call',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function ProviderDashboardPage() {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal')

  const now = new Date()

  const [provider, todayVisits, upcomingVisits, myPatients, recentAlerts] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session.userId },
      select: { firstName: true, lastName: true, firstNameNepali: true, email: true, phone: true,
                branch: { select: { name: true } } },
    }),
    prisma.visit.findMany({
      where: {
        providerId:  session.userId,
        scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true, scheduledAt: true, scheduledEnd: true, status: true, serviceCode: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true, chronicConditions: true } },
        nurse:   { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.visit.findMany({
      where: {
        providerId:  session.userId,
        scheduledAt: { gt: endOfDay(now) },
        status:      { in: ['scheduled', 'en_route', 'checked_in'] },
      },
      orderBy: { scheduledAt: 'asc' },
      take:    5,
      select: {
        id: true, scheduledAt: true, status: true, serviceCode: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      },
    }),
    prisma.patient.findMany({
      where:   { primaryDoctorId: session.userId, isActive: true },
      orderBy: { lastName: 'asc' },
      take:    8,
      select: {
        id: true, firstName: true, lastName: true, mrn: true,
        dateOfBirth: true, gender: true, chronicConditions: true,
        primaryNurse: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.clinicalAlert.findMany({
      where: {
        isResolved: false,
        patient:    { primaryDoctorId: session.userId },
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take:    5,
      select: {
        id: true, title: true, severity: true, createdAt: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      },
    }),
  ])

  if (!provider) redirect('/provider-portal')

  const completedToday = todayVisits.filter(v => v.status === 'completed').length
  const myPatientCount = await prisma.patient.count({ where: { primaryDoctorId: session.userId, isActive: true } })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting()}, Dr. {provider.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(now, 'EEEE, MMMM d, yyyy')}
            {provider.branch && <> · {provider.branch.name}</>}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {provider.firstName[0]}{provider.lastName[0]}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500 font-medium">My Patients</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{myPatientCount}</p>
          <p className="text-xs text-gray-400">active patients</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500 font-medium">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayVisits.length}</p>
          <p className="text-xs text-gray-400">{completedToday} completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">Alerts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{recentAlerts.length}</p>
          <p className="text-xs text-gray-400">pending review</p>
        </div>
      </div>

      {/* Today's schedule */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Today&apos;s Schedule
          {todayVisits.length > 0 && (
            <span className="ml-auto text-xs font-normal text-gray-400">{todayVisits.length} visits</span>
          )}
        </h2>
        {todayVisits.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No visits scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayVisits.map(v => {
              const age = differenceInYears(now, new Date(v.patient.dateOfBirth))
              return (
                <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-sm font-bold text-blue-700">{format(new Date(v.scheduledAt), 'h:mm')}</p>
                    <p className="text-xs text-gray-400">{format(new Date(v.scheduledAt), 'a')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/provider-portal/visits/${v.id}`} className="font-semibold text-gray-900 hover:text-blue-700 transition-colors">
                        {v.patient.firstName} {v.patient.lastName}
                      </Link>
                      <span className="text-xs text-gray-400">{age}y · {v.patient.mrn}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[v.status] ?? v.status}
                      </span>
                    </div>
                    <Link href={`/provider-portal/patients/${v.patient.id}`} className="text-xs text-blue-500 hover:underline">
                      View chart →
                    </Link>
                    {v.serviceCode && (
                      <p className="text-xs text-blue-600 mt-0.5">{SERVICE_LABELS[v.serviceCode] ?? v.serviceCode}</p>
                    )}
                    {v.patient.chronicConditions.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {v.patient.chronicConditions.slice(0, 2).join(' · ')}
                        {v.patient.chronicConditions.length > 2 && ` +${v.patient.chronicConditions.length - 2} more`}
                      </p>
                    )}
                    {v.nurse && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Nurse: {v.nurse.firstName} {v.nurse.lastName}
                      </p>
                    )}
                  </div>
                  {v.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Upcoming visits */}
      {upcomingVisits.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Visits</h2>
          <div className="space-y-2">
            {upcomingVisits.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                <div className="shrink-0 text-center w-12">
                  <p className="text-xs font-bold text-gray-700">{format(new Date(v.scheduledAt), 'MMM d')}</p>
                  <p className="text-xs text-gray-400">{format(new Date(v.scheduledAt), 'h:mm a')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/provider-portal/patients/${v.patient.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-700 transition-colors truncate block">
                    {v.patient.firstName} {v.patient.lastName}
                  </Link>
                  <p className="text-xs text-gray-400">{v.patient.mrn}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[v.status] ?? v.status}
                  </span>
                  <Link href={`/provider-portal/visits/${v.id}`} className="text-xs text-blue-600 font-medium hover:underline whitespace-nowrap">
                    Wellness Check
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clinical alerts */}
      {recentAlerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Clinical Alerts
          </h2>
          <div className="space-y-2">
            {recentAlerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-3 flex items-start gap-3 ${
                  alert.severity === 'critical' ? 'border-red-200' :
                  alert.severity === 'warn'     ? 'border-orange-200' : 'border-gray-200'
                }`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'warn'     ? 'bg-orange-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <Link href={`/provider-portal/patients/${alert.patient.id}`} className="text-xs text-blue-600 hover:underline">
                    {alert.patient.firstName} {alert.patient.lastName} · {alert.patient.mrn}
                  </Link>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{format(new Date(alert.createdAt), 'MMM d')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My patients */}
      {myPatients.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            My Patients
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myPatients.map(p => {
              const age = differenceInYears(now, new Date(p.dateOfBirth))
              return (
                <Link key={p.id} href={`/provider-portal/patients/${p.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all group">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {age}y {p.gender ? `· ${p.gender}` : ''} · {p.mrn}
                    </p>
                    {p.chronicConditions.length > 0 && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {p.chronicConditions.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          {myPatientCount > 8 && (
            <p className="text-xs text-center text-blue-600 mt-2">
              +{myPatientCount - 8} more · <a href="/provider-portal/patients" className="underline">View all</a>
            </p>
          )}
        </section>
      )}
    </div>
  )
}
