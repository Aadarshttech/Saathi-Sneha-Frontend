'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { NEPAL_PROVINCES, BLOOD_GROUPS } from '@/lib/constants'

const RELATIONSHIPS = ['Son', 'Daughter', 'Son-in-law', 'Daughter-in-law', 'Grandchild', 'Other']

export default function OnboardingForm({ firstName }: { firstName: string }) {
  const router = useRouter()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    // About You
    phone: '', country: '', relationshipToPatient: '',
    // About Your Parent
    firstName: '', lastName: '', firstNameNepali: '',
    gender: '', dateOfBirth: '',
    patientPhone: '', patientEmail: '',
    bloodGroup: '', allergies: '', chronicConditions: '',
    province: '', district: '', municipality: '', wardNo: '', streetAddress: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          wardNo: form.wardNo ? Number(form.wardNo) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Please check the form and try again.'); return }
      router.push(data.redirect ?? '/portal/plans')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-brand-red'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Hi {firstName}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Your Phone / WhatsApp</label>
            <input className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
          </div>
          <div>
            <label className={labelClass}>Country You Live In</label>
            <input className={inputClass} value={form.country} onChange={e => set('country', e.target.value)} placeholder="United States" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Your Relationship to the Parent</label>
            <select className={inputClass} value={form.relationshipToPatient} onChange={e => set('relationshipToPatient', e.target.value)}>
              <option value="">Select…</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">About Your Parent</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name <span className="text-brand-red">*</span></label>
            <input className={inputClass} required value={form.firstName} onChange={e => set('firstName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Last Name <span className="text-brand-red">*</span></label>
            <input className={inputClass} required value={form.lastName} onChange={e => set('lastName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>First Name (Nepali)</label>
            <input className={inputClass} value={form.firstNameNepali} onChange={e => set('firstNameNepali', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Gender <span className="text-brand-red">*</span></label>
            <select className={inputClass} required value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date of Birth <span className="text-brand-red">*</span></label>
            <input type="date" className={inputClass} required value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Blood Group</label>
            <select className={inputClass} value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
              <option value="">Select…</option>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Parent&apos;s Phone (in Nepal)</label>
            <input className={inputClass} value={form.patientPhone} onChange={e => set('patientPhone', e.target.value)} placeholder="98XXXXXXXX" />
          </div>
          <div>
            <label className={labelClass}>Parent&apos;s Email</label>
            <input type="email" className={inputClass} value={form.patientEmail} onChange={e => set('patientEmail', e.target.value)} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Allergies <span className="text-gray-400 text-xs">(comma-separated)</span></label>
            <input className={inputClass} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Penicillin, Peanuts" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Chronic Conditions <span className="text-gray-400 text-xs">(comma-separated)</span></label>
            <input className={inputClass} value={form.chronicConditions} onChange={e => set('chronicConditions', e.target.value)} placeholder="Diabetes, Hypertension" />
          </div>

          <div>
            <label className={labelClass}>Province</label>
            <select className={inputClass} value={form.province} onChange={e => set('province', e.target.value)}>
              <option value="">Select…</option>
              {NEPAL_PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>District</label>
            <input className={inputClass} value={form.district} onChange={e => set('district', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Municipality</label>
            <input className={inputClass} value={form.municipality} onChange={e => set('municipality', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Ward No.</label>
            <input type="number" className={inputClass} value={form.wardNo} onChange={e => set('wardNo', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Street Address</label>
            <input className={inputClass} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Emergency Contact Name</label>
            <input className={inputClass} value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Emergency Contact Phone</label>
            <input className={inputClass} value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Emergency Contact Relation</label>
            <input className={inputClass} value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} />
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-red text-white rounded-xl font-bold text-sm hover:bg-brand-red-dark transition-colors disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Continue to Care Plans'}
      </button>
    </form>
  )
}
