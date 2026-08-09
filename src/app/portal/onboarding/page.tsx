import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import OnboardingForm from './onboarding-form'

export default function OnboardingPage() {
  const session = getPortalSession()
  if (!session) redirect('/portal/login')
  if (session.patientId) redirect('/portal/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tell us about your family</h1>
          <p className="text-sm text-gray-500 mt-1">
            A few details about you and your parent so we can set up their care.
          </p>
        </div>
        <OnboardingForm firstName={session.firstName} />
      </div>
    </div>
  )
}
