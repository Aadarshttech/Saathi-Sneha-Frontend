import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Phone } from 'lucide-react'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Care Plans | Saathi Sneha Care',
  description: 'Transparent, flexible home health care plans for your parents in Nepal — pay monthly from anywhere in the world.',
}

export default async function PlansPage() {
  const plans = [
    { id: '1', name: 'Care Connect', nameNepali: 'केयर कनेक्ट', description: 'Basic care for independent parents.', features: ['Monthly doctor visit', 'Weekly nurse call', '24/7 Support'] },
    { id: '2', name: 'Wellness Plus', nameNepali: 'वेलनेस प्लस', description: 'Comprehensive care and monitoring.', features: ['Bi-weekly doctor visit', 'Weekly nurse visit', 'Medication delivery'] },
    { id: '3', name: 'Chronic Care', nameNepali: 'क्रोनिक केयर', description: 'Intensive care for chronic conditions.', features: ['Weekly doctor visit', 'Daily nurse check-in', 'Lab monitoring'] },
  ]

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-brand-surface border-b border-brand-border py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Care Plans</h1>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
            No lock-in contracts. Cancel or upgrade anytime. Pay monthly via card from abroad or Khalti from Nepal.
          </p>
        </div>
      </section>

      {/* Plans grid */}
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {plans.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No plans available yet.</div>
          ) : (
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

                  <Link
                    href={`/contact?plan=${encodeURIComponent(plan.name)}`}
                    className={`block text-center py-3 rounded-xl text-sm font-bold transition-colors ${
                      i === 1
                        ? 'bg-brand-red text-white hover:bg-brand-red-dark'
                        : 'bg-brand-dark text-white hover:bg-black'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 bg-brand-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-brand-dark text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I pay from abroad?',                  a: 'Yes. We accept international credit and debit cards via Stripe. All prices are in NPR but your card will be charged in your local currency at the prevailing exchange rate.' },
              { q: 'Can my parents pay locally?',             a: 'Yes. We accept Khalti and cash payment. Families in Nepal can pay monthly directly through the patient portal.' },
              { q: 'Is there a setup or joining fee?',        a: 'No. There are no hidden fees. The monthly plan price covers all included services. Add-ons (extra visits, specialist consults) are billed separately and quoted in advance.' },
              { q: 'Can I change or cancel the plan?',        a: 'Yes. You can upgrade, downgrade, or cancel anytime. Changes take effect from the next billing cycle. There are no cancellation penalties.' },
              { q: 'What if my parents need more visits?',    a: 'Additional visits outside the plan can be booked individually. Our care coordinator will advise on the most cost-effective option for your parents\' needs.' },
              { q: 'Do you serve outside Kathmandu?',         a: 'Currently our full service is available in the Kathmandu Valley. We are expanding to Pokhara and Biratnagar. Contact us to check availability in your parents\' location.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-brand-border p-5">
                <h3 className="font-semibold text-brand-dark mb-2">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 bg-white border-t border-brand-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl font-bold text-brand-dark mb-2">Not sure which plan to choose?</h2>
          <p className="text-gray-500 mb-6 text-sm">Our care team will assess your parents&apos; needs and recommend the right plan — for free, no commitment.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-red text-white px-8 py-3.5 rounded-xl font-bold hover:bg-brand-red-dark transition-colors">
            <Phone className="w-4 h-4" /> Free Care Assessment
          </Link>
        </div>
      </section>
    </div>
  )
}
