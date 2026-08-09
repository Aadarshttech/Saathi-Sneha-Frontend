'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Plan {
  id: string
  name: string
  nameNepali: string | null
  description: string | null
  features: string[]
  priceMinNpr: number
}

export default function PlansClient({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSubscribe(planId: string) {
    setError('')
    setSubscribing(planId)
    try {
      const subRes  = await fetch('/api/portal/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId }),
      })
      const subData = await subRes.json()
      if (!subRes.ok) { setError(subData.error ?? 'Could not start subscription.'); return }

      router.push(`/portal/plans/checkout?subscriptionId=${subData.subscriptionId}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-6 max-w-2xl mx-auto">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-7 border flex flex-col ${
              i === 1
                ? 'bg-brand-dark text-white border-brand-dark shadow-2xl ring-2 ring-brand-red'
                : 'bg-white border-brand-border shadow-sm'
            }`}
          >
            {i === 1 && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-red text-white text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                MOST POPULAR
              </div>
            )}
            <div className="mb-5">
              <h2 className={`text-xl font-bold mb-1 ${i === 1 ? 'text-white' : 'text-brand-dark'}`}>{plan.name}</h2>
              {plan.nameNepali && (
                <p className={`text-sm font-nepali ${i === 1 ? 'text-white/60' : 'text-gray-400'}`}>{plan.nameNepali}</p>
              )}
            </div>

            <p className={`text-2xl font-bold mb-5 ${i === 1 ? 'text-white' : 'text-brand-dark'}`}>
              ${plan.priceMinNpr.toLocaleString()}<span className="text-sm font-normal opacity-70">/mo</span>
            </p>

            <div className={`mb-5 pb-5 border-b ${i === 1 ? 'border-white/10' : 'border-brand-border'}`}>
              <p className={`text-sm leading-relaxed ${i === 1 ? 'text-white/70' : 'text-gray-500'}`}>
                {plan.description}
              </p>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${i === 1 ? 'text-brand-red' : 'text-brand-green'}`} />
                  <span className={i === 1 ? 'text-white/80' : 'text-gray-700'}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={subscribing !== null}
              className={`block text-center py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
                i === 1
                  ? 'bg-brand-red text-white hover:bg-brand-red-dark'
                  : 'bg-brand-dark text-white hover:bg-black'
              }`}
            >
              {subscribing === plan.id ? 'Please wait…' : 'Choose This Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
