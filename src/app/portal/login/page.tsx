import { Suspense } from 'react'
import LoginForm from './login-form'

export default function PortalLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-sm h-96 rounded-2xl bg-white/50 md:animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
