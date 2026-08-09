import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'
import { format } from 'date-fns'
import { Calendar, Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Visits' }

const STATUS_STYLES: Record<string, string> = {
  requested:   'bg-pink-100 text-pink-700',
  scheduled:   'bg-blue-100 text-blue-700',
  en_route:    'bg-yellow-100 text-yellow-700',
  checked_in:  'bg-purple-100 text-purple-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
  missed:      'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  requested:   'Pending Confirmation from Provider',
  scheduled:   'Scheduled',
  en_route:    'On the way',
  checked_in:  'Arrived',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  missed:      'Missed',
}

const SERVICE_LABELS: Record<string, string> = {
  wellness_check:              'Wellness Check',
  chronic_disease_monitoring:  'Chronic Disease Monitoring',
  medication_management:       'Medication Management',
  doctor_consultation:         'Doctor Consultation',
  lab_coordination:            'Lab Coordination',
  physiotherapy:               'Physiotherapy',
  post_hospital_care:          'Post-Hospital Care',
  hospital_escort:             'Hospital Escort',
  caregiver_support:           'Caregiver Support',
  mental_wellness_check:       'Mental Wellness Check',
  urgent_nurse_visit:          'Urgent Nurse Visit',
  doctor_on_call:              'Doctor On Call',
  ambulance_coordination:      'Ambulance Coordination',
  hospital_admission_support:  'Hospital Admission Support',
  medicine_delivery:           'Medicine Delivery',
  family_video_update:         'Family Video Update',
}

export default async function PortalVisitsPage() {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal')

  const visits = await prisma.visit.findMany({
    where:   { patientId: session.patientId },
    orderBy: { scheduledAt: 'desc' },
    take:    60,
    select: {
      id: true, scheduledAt: true, scheduledEnd: true, status: true,
      serviceCode: true, notes: true,
      nurse:    { select: { firstName: true, lastName: true } },
      provider: { select: { firstName: true, lastName: true } },
    },
  })

  const now      = new Date()
  const upcoming = visits.filter(v => new Date(v.scheduledAt) >= now && v.status !== 'cancelled' && v.status !== 'completed')
  const past     = visits.filter(v => new Date(v.scheduledAt) < now || v.status === 'completed' || v.status === 'cancelled' || v.status === 'missed')

  function VisitCard({ v }: { v: typeof visits[0] }) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-semibold text-gray-900">
              {format(new Date(v.scheduledAt), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(v.scheduledAt), 'h:mm a')} – {format(new Date(v.scheduledEnd), 'h:mm a')}
            </p>
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[v.status] ?? v.status}
          </span>
        </div>
        {v.serviceCode && (
          <p className="text-sm text-brand-red font-medium mb-1">
            {SERVICE_LABELS[v.serviceCode] ?? v.serviceCode}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
          {v.nurse    && <span>Nurse: {v.nurse.firstName} {v.nurse.lastName}</span>}
          {v.provider && <span>Dr: {v.provider.firstName} {v.provider.lastName}</span>}
        </div>
        {v.notes && (
          <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 italic">{v.notes}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Visits</h1>
        <Link
          href="/portal/visits/request"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Request a Visit
        </Link>
      </div>

      {upcoming.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
          <div className="space-y-3">
            {upcoming.map(v => <VisitCard key={v.id} v={v} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past Visits</p>
          <div className="space-y-3">
            {past.map(v => <VisitCard key={v.id} v={v} />)}
          </div>
        </section>
      )}

      {visits.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No visits yet</p>
          <p className="text-sm mt-1">Your visit history will appear here</p>
        </div>
      )}
    </div>
  )
}
