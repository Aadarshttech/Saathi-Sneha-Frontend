'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirm, setConfirm]                 = useState('')
  const [showPw, setShowPw]                   = useState(false)
  const [status, setStatus]                   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError]                     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) { setError('New passwords do not match.'); return }
    if (newPassword.length < 8)  { setError('New password must be at least 8 characters.'); return }

    setStatus('saving')
    try {
      const res = await fetch('/api/staff/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setError(data.error ?? 'Failed to change password.'); return }
      setStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  const inputClass = 'w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-brand-red'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 max-w-md space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {status === 'saved' && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Password changed successfully.</span>
        </div>
      )}

      <div>
        <label className={labelClass}>Current Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showPw ? 'text' : 'password'}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showPw ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className={inputClass}
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

      <div>
        <label className={labelClass}>Confirm New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full py-2.5 bg-brand-red text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
      >
        {status === 'saving' ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  )
}
