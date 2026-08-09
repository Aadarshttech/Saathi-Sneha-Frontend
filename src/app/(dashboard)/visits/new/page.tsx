import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ScheduleVisitForm from './schedule-visit-form'

export const metadata: Metadata = { title: 'Schedule Visit' }

export default function NewVisitPage({ searchParams }: { searchParams: { patientId?: string } }) {
  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <Link href="/visits" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to Visits
        </Link>
        <h1>Schedule Visit</h1>
        <p className="text-sm text-brand-muted mt-0.5">Book a new home visit for a patient</p>
      </div>
      <ScheduleVisitForm preselectedPatientId={searchParams.patientId} />
    </div>
  )
}
