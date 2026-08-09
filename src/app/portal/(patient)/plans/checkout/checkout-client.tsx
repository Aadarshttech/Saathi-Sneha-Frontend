'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, AlertCircle, ArrowLeft } from 'lucide-react'

export default function CheckoutClient({ subscriptionId }: { subscriptionId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function payWithCard() {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/billing/stripe/subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscriptionId, successPath: '/portal/dashboard' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not start checkout.'); return }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={payWithCard}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-red text-white rounded-xl font-bold text-sm hover:bg-brand-red-dark transition-colors disabled:opacity-60"
      >
        <CreditCard className="w-4 h-4" />
        {loading ? 'Redirecting to payment…' : 'Pay with Card'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Card payments are processed securely by Stripe. You&apos;ll be charged monthly starting today.
      </p>

      <Link
        href="/portal/plans"
        className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 pt-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Choose a different plan
      </Link>
    </div>
  )
}
