import { Suspense } from 'react'
import SignupForm from './signup-form'

export default function PortalSignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-sm h-96 rounded-2xl bg-white/50" />}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
