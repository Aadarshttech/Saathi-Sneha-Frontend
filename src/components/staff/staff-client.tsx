'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X, Save, User, UserCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StaffData {
  id: string; role: string
  firstName: string; lastName: string
  firstNameNepali: string | null; lastNameNepali: string | null
  email: string | null; phone: string
  gender: string | null; isActive: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' }

// ─── Shared inputs ────────────────────────────────────────────────────────────

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <input {...props}
        className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
    </div>
  )
}

function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-brand-muted mb-1">{label}</label>
      <select {...props}
        className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-red/30">
        {children}
      </select>
    </div>
  )
}

// ─── Staff Form ───────────────────────────────────────────────────────────────

interface StaffFormState {
  firstName: string; lastName: string
  firstNameNepali: string; lastNameNepali: string
  email: string; phone: string; gender: string; isActive: boolean
}

function initForm(staff?: StaffData): StaffFormState {
  if (!staff) return { firstName: '', lastName: '', firstNameNepali: '', lastNameNepali: '', email: '', phone: '', gender: '', isActive: true }
  return {
    firstName: staff.firstName, lastName: staff.lastName,
    firstNameNepali: staff.firstNameNepali ?? '', lastNameNepali: staff.lastNameNepali ?? '',
    email: staff.email ?? '', phone: staff.phone, gender: staff.gender ?? '', isActive: staff.isActive,
  }
}

function StaffForm({ staff, role, onSave, onCancel }: {
  staff?: StaffData
  role: 'provider' | 'nurse'
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const isNew = !staff
  const [form, setForm] = useState<StaffFormState>(initForm(staff))
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const f = (k: keyof StaffFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('First and last name are required'); return }
    if (!form.phone.trim()) { setError('Phone number is required'); return }
    setSaving(true); setError(null)
    try {
      await onSave({
        ...(isNew && { role }),
        firstName:       form.firstName.trim(),
        lastName:        form.lastName.trim(),
        firstNameNepali: form.firstNameNepali.trim() || null,
        lastNameNepali:  form.lastNameNepali.trim()  || null,
        email:           form.email.trim()            || null,
        phone:           form.phone.trim(),
        gender:          form.gender                  || null,
        isActive:        form.isActive,
      })
    } catch (e: unknown) { setError((e as Error).message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  const roleLabel = role === 'provider' ? 'Doctor / Provider' : 'Nurse'

  return (
    <div className="rounded-xl border border-brand-red/20 bg-brand-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{isNew ? `Add ${roleLabel}` : `Edit: ${staff?.firstName} ${staff?.lastName}`}</h4>
        <button onClick={onCancel} className="text-brand-muted hover:text-brand-dark"><X className="w-4 h-4" /></button>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <InputField label="First Name (English) *" value={form.firstName} onChange={f('firstName')} placeholder="Ramesh" />
        <InputField label="Last Name (English) *"  value={form.lastName}  onChange={f('lastName')}  placeholder="Sharma" />
        <InputField label="First Name (Nepali)"    value={form.firstNameNepali} onChange={f('firstNameNepali')} placeholder="रमेश" />
        <InputField label="Last Name (Nepali)"     value={form.lastNameNepali}  onChange={f('lastNameNepali')}  placeholder="शर्मा" />
        <InputField label="Phone *" type="tel"   value={form.phone} onChange={f('phone')} placeholder="+977 98XXXXXXXX" />
        <InputField label="Email"   type="email" value={form.email} onChange={f('email')} placeholder="name@clinic.com" />
        <SelectField label="Gender" value={form.gender} onChange={f('gender')}>
          <option value="">— Select —</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </SelectField>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <input type="checkbox" checked={form.isActive}
            onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
          Active
        </label>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={save}>
          <Save className="w-3.5 h-3.5" /> {isNew ? `Add ${roleLabel}` : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function StaffClient({ role, initialStaff }: {
  role:         'provider' | 'nurse'
  initialStaff: StaffData[]
}) {
  const router = useRouter()
  const [staff,     setStaff]     = useState<StaffData[]>(initialStaff)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd,   setShowAdd]   = useState(false)

  const roleLabel    = role === 'provider' ? 'Doctor / Provider' : 'Nurse'
  const rolePlural   = role === 'provider' ? 'Providers'          : 'Nurses'
  const Icon         = role === 'provider' ? UserCheck             : User

  const create = async (data: Record<string, unknown>) => {
    const res  = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to create')
    setStaff(p => [...p, json.data])
    setShowAdd(false); router.refresh()
  }

  const update = async (id: string, data: Record<string, unknown>) => {
    const res  = await fetch(`/api/staff/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')
    setStaff(p => p.map(s => s.id === id ? { ...s, ...json.data } : s))
    setEditingId(null); router.refresh()
  }

  const activeCount = staff.filter(s => s.isActive).length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1>{rolePlural}</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {staff.length} {rolePlural.toLowerCase()} · {activeCount} active
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditingId(null) }}>
          <Plus className="w-4 h-4" /> Add {roleLabel}
        </Button>
      </div>

      {showAdd && (
        <StaffForm role={role} onSave={create} onCancel={() => setShowAdd(false)} />
      )}

      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-brand-border">
            <tr className="text-xs text-brand-muted">
              <th className="text-left px-4 py-2.5 font-medium w-[30%]">Name</th>
              <th className="text-left px-3 py-2.5 font-medium">Phone</th>
              <th className="text-left px-3 py-2.5 font-medium">Email</th>
              <th className="text-center px-3 py-2.5 font-medium">Gender</th>
              <th className="text-center px-3 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {/* Inline edit row */}
            {editingId && staff.find(s => s.id === editingId) && (
              <tr key={`edit-${editingId}`}>
                <td colSpan={6} className="px-4 py-3 bg-brand-surface/60">
                  <StaffForm
                    role={role}
                    staff={staff.find(s => s.id === editingId)!}
                    onSave={data => update(editingId, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </td>
              </tr>
            )}

            {staff.filter(s => s.id !== editingId).map(s => (
              <tr key={s.id} className={`hover:bg-brand-surface/40 transition-colors ${!s.isActive ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-dark">{s.firstName} {s.lastName}</p>
                  {(s.firstNameNepali || s.lastNameNepali) && (
                    <p className="text-xs text-brand-muted">{[s.firstNameNepali, s.lastNameNepali].filter(Boolean).join(' ')}</p>
                  )}
                </td>
                <td className="px-3 py-3 text-sm">{s.phone}</td>
                <td className="px-3 py-3 text-sm text-brand-muted">{s.email ?? '—'}</td>
                <td className="px-3 py-3 text-center text-xs text-brand-muted">
                  {s.gender ? GENDER_LABELS[s.gender] ?? s.gender : '—'}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setEditingId(s.id); setShowAdd(false) }}
                    className="p-1 rounded hover:bg-brand-surface text-brand-muted hover:text-brand-dark transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {staff.length === 0 && !showAdd && (
              <tr>
                <td colSpan={6} className="text-center py-14 text-brand-muted">
                  <Icon className="w-8 h-8 mx-auto mb-2 opacity-25" />
                  <p className="text-sm">No {rolePlural.toLowerCase()} added yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
