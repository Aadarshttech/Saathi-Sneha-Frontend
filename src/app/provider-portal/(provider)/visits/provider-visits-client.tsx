'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, ChevronRight } from 'lucide-react'

interface Visit {
  id:          string
  scheduledAt: string
  scheduledEnd: string
  status:      string
  serviceCode: string | null
  visitType:   string | null
  notes:       string | null
  patient:     { firstName: string; lastName: string; mrn: string; chronicConditions: string[] }
  nurse:       { firstName: string; lastName: string } | null
  tasks:       { id: string; status: string }[]
}

const STATUS_OPTIONS = ['scheduled', 'en_route', 'checked_in', 'in_progress', 'completed', 'cancelled', 'missed']

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
  caregiver_support:          'Caregiver Support',
  mental_wellness_check:      'Mental Wellness Check',
}

export default function ProviderVisitsClient({
  visits,
  date,
  status,
  showAll,
}: {
  visits:   Visit[]
  date:     string
  status:   string
  showAll:  boolean
}) {
  const router = useRouter()

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (!params.all) {
      sp.set('date',   params.date   ?? date)
      sp.set('status', params.status ?? status)
    } else {
      sp.set('all', '1')
    }
    router.push(`/provider-portal/visits?${sp}`)
  }

  const completedCount = visits.filter(v => v.status === 'completed').length
  const label = showAll
    ? `${visits.length} visits total`
    : `${visits.length} visit${visits.length !== 1 ? 's' : ''} · ${completedCount} completed`

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {!showAll && (
          <input
            type="date"
            value={date}
            onChange={e => navigate({ date: e.target.value, status })}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => navigate({ date, status: '' })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !status && !showAll ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            All Statuses
          </button>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => navigate({ date, status: s })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s && !showAll ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <button
          onClick={() => showAll ? navigate({ date, status }) : navigate({ all: '1' })}
          className="ml-auto text-xs text-blue-600 hover:underline"
        >
          {showAll ? '← Today' : 'View all →'}
        </button>
      </div>

      <p className="text-xs text-gray-400">{label}</p>

      {/* Visit list */}
      {visits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium">No visits found</p>
          <p className="text-xs mt-1">Try a different date or status filter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visits.map(v => {
            const tasksDone = v.tasks.filter(t => t.status === 'completed').length
            const serviceName = v.serviceCode ? (SERVICE_LABELS[v.serviceCode] ?? v.serviceCode) :
                                v.visitType   ? v.visitType.replace(/_/g, ' ')                   : null

            return (
              <button
                key={v.id}
                onClick={() => router.push(`/provider-portal/visits/${v.id}`)}
                className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all text-left group"
              >
                {/* Time column */}
                <div className="text-center shrink-0 w-14">
                  <p className="text-sm font-bold text-blue-700">{format(new Date(v.scheduledAt), 'h:mm')}</p>
                  <p className="text-xs text-gray-400">{format(new Date(v.scheduledAt), 'a')}</p>
                  {showAll && (
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(v.scheduledAt), 'MMM d')}</p>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{v.patient.firstName} {v.patient.lastName}</p>
                    <span className="text-xs text-gray-400">{v.patient.mrn}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[v.status] ?? v.status}
                    </span>
                  </div>
                  {serviceName && (
                    <p className="text-xs text-blue-600 mt-0.5 capitalize">{serviceName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {v.nurse && <span>Nurse: {v.nurse.firstName} {v.nurse.lastName}</span>}
                    {v.tasks.length > 0 && (
                      <span>{tasksDone}/{v.tasks.length} tasks done</span>
                    )}
                    {v.patient.chronicConditions.length > 0 && (
                      <span className="truncate">{v.patient.chronicConditions.slice(0, 2).join(' · ')}</span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0 transition-colors" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
