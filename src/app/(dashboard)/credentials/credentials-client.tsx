'use client'

import { useState } from 'react'
import { KeyRound, Mail, Send, CheckCircle2, AlertCircle, Stethoscope, FlaskConical } from 'lucide-react'

interface StaffMember {
  id:          string
  firstName:   string
  lastName:    string
  email:       string
  role:        string
  hasPassword: boolean
}

function CredentialRow({ member, onReset }: { member: StaffMember; onReset: (id: string, email: string) => void }) {
  const [email, setEmail]     = useState(member.email)
  const [status, setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg, setErrMsg]   = useState('')

  async function handleReset() {
    setStatus('sending')
    setErrMsg('')
    try {
      const res = await fetch('/api/staff/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: member.id, email: email.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setErrMsg(data.error ?? 'Failed'); return }
      setStatus('sent')
      onReset(member.id, data.email)
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setStatus('error')
      setErrMsg('Network error.')
    }
  }

  return (
    <div className="bg-white border border-brand-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-brand-red/10 text-brand-red font-bold text-sm flex items-center justify-center shrink-0">
          {member.firstName[0]}{member.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-dark text-sm">{member.firstName} {member.lastName}</p>
          <p className="text-xs text-gray-400">{member.role === 'provider' ? 'Provider' : 'Lab Tech'}</p>
        </div>
        {member.hasPassword
          ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Password set</span>
          : <span className="text-xs text-amber-500 font-medium flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> No password</span>
        }
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-3">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-600 mb-1">Email (username)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@saathisnehacare.com"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={status === 'sending'}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-semibold hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          <Send className="w-3.5 h-3.5" />
          {status === 'sending' ? 'Sending…' : member.hasPassword ? 'Reset Password' : 'Send Login Password'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        A new temporary password is generated automatically and emailed directly to them — it&apos;s never shown here.
      </p>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-xs mt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errMsg}
        </div>
      )}
      {status === 'sent' && (
        <div className="flex items-center gap-2 text-emerald-600 text-xs mt-2 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> New password emailed to {email}
        </div>
      )}
    </div>
  )
}

export default function CredentialsClient({ staff }: { staff: StaffMember[] }) {
  const [tab, setTab] = useState<'provider' | 'lab_tech'>('provider')
  const [members, setMembers] = useState(staff)

  const filtered = members.filter(m => m.role === tab)

  function handleReset(id: string, email: string) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, email, hasPassword: true } : m))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark">Staff Credentials</h1>
        <p className="text-sm text-gray-500 mt-1">Set the login email and reset passwords for providers and lab staff. Passwords are always generated and emailed directly — never entered here.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('provider')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'provider' ? 'bg-brand-red text-white' : 'bg-white border border-brand-border text-gray-600 hover:border-brand-red'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Providers ({members.filter(m => m.role === 'provider').length})
        </button>
        <button
          onClick={() => setTab('lab_tech')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'lab_tech' ? 'bg-brand-red text-white' : 'bg-white border border-brand-border text-gray-600 hover:border-brand-red'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Lab Staff ({members.filter(m => m.role === 'lab_tech').length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-brand-border">
          <p className="text-sm">No {tab === 'provider' ? 'providers' : 'lab staff'} found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <CredentialRow key={m.id} member={m} onReset={handleReset} />
          ))}
        </div>
      )}
    </div>
  )
}
