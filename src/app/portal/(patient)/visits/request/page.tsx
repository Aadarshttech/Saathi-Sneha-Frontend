import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getPortalSession } from '@/lib/portal-auth'
import RequestVisitForm from './request-visit-form'

export default function RequestVisitPage() {
  const session = getPortalSession()
  if (!session || !session.patientId) redirect('/portal')

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/portal/visits" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> My Visits
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Request a Visit</h1>
        <p className="text-sm text-gray-500 mt-1">Let us know what your parent needs — we&apos;ll confirm a nurse and exact time.</p>
      </div>
      <RequestVisitForm />
    </div>
  )
}
