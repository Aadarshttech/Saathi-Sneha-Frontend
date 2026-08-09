'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: 'That verification link is invalid. Please log in or sign up again.',
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryError = searchParams.get('error')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/portal/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      router.push(data.redirect ?? '/portal/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayError = error || (queryError && ERROR_MESSAGES[queryError]) || ''

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-1 mb-2">
          <Image src="/logo.png" alt="Saathi Sneha Care" width={52} height={52} className="object-contain" />
          <div className="leading-none">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-[#2a9d8f] text-2xl tracking-tight">Saathi</span>
              <span className="text-[13px] font-semibold tracking-[0.08em] text-[#4a7c6b] [word-spacing:-0.1em]">Sneha Care</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#6aab5e] text-[8px]">♥</span>
              <span className="text-[11px] text-[#6aab5e] font-medium italic">Care that feels like family</span>
              <span className="text-[#6aab5e] text-[8px]">♥</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Patient Portal</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-5">Sign in with your email</p>

        {displayError && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-brand-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-brand-red"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-red text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          New here?{' '}
          <Link href="/portal/signup" className="text-brand-red hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Need help? Contact your care coordinator
      </p>
    </div>
  )
}
