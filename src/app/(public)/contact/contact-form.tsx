'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, CheckCircle2 } from 'lucide-react'

const GOALS = [
  'I want to enroll my parents in a care plan',
  'I need post-hospital care for a family member',
  'I want to learn more before committing',
  "I'm calling from Nepal for myself",
  'Other',
]

export default function ContactForm() {
  const searchParams = useSearchParams()
  const preselectedPlan = searchParams.get('plan') || ''

  const [form, setForm] = useState({
    name:    '',
    email:   '',
    phone:   '',
    plan:    preselectedPlan,
    goal:    '',
    message: '',
    website: '', // honeypot — never shown to users
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (preselectedPlan) setForm(f => ({ ...f, plan: preselectedPlan }))
  }, [preselectedPlan])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Server error')
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  function field(key: keyof typeof form, label: string, type = 'text', required = true) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}{required && <span className="text-brand-red ml-0.5">*</span>}
        </label>
        <input
          type={type}
          required={required}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-sm"
        />
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-brand-green mx-auto mb-4" />
        <h3 className="text-xl font-bold text-brand-dark mb-2">Message received!</h3>
        <p className="text-gray-500">Our care team will reach out within 24 hours. We look forward to supporting your family.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — hidden from real users, bots fill it automatically */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: 'none' }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('name',  'Your Name')}
        {field('email', 'Email Address', 'email')}
      </div>
      {field('phone', 'Phone / WhatsApp', 'tel', false)}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">I am reaching out because…</label>
        <select
          value={form.goal}
          onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-sm bg-white"
        >
          <option value="">Select…</option>
          {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tell us about your parents&apos; situation <span className="text-brand-red">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Age, health conditions, location in Nepal, what you're most worried about…"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-sm resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">
          Something went wrong. Please reach out to us on WhatsApp or Messenger above.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3 rounded-xl font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        We never share your information. See our <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  )
}
