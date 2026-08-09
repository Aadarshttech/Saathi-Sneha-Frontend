'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DEFAULT_ORG_ID, SERVICE_CODE_LABELS } from '@/lib/constants'

const schema = z.object({
  patientId:   z.string().uuid('Select a patient'),
  nurseId:     z.string().uuid().optional().or(z.literal('')),
  visitType:   z.string().min(1, 'Required'),
  scheduledAt: z.string().min(1, 'Required'),
  durationMin: z.number().int().min(15).max(480).default(60),
  notes:       z.string().optional(),
  services:    z.array(z.string()).min(1, 'Select at least one service'),
})

type FormData = z.infer<typeof schema>

const VISIT_TYPES = [
  { value: 'wellness_check',   label: 'Wellness Check' },
  { value: 'follow_up',        label: 'Follow-up Visit' },
  { value: 'post_discharge',   label: 'Post-Discharge Care' },
  { value: 'chronic_care',     label: 'Chronic Care' },
  { value: 'urgent',           label: 'Urgent Visit' },
]

interface Patient { id: string; mrn: string; firstName: string; lastName: string }
interface User    { id: string; firstName: string; lastName: string; role: string }

export default function ScheduleVisitForm({ preselectedPatientId }: { preselectedPatientId?: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [nurses,   setNurses]   = useState<User[]>([])
  const [services, setServices] = useState<{ value: string; label: string }[]>([])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: preselectedPatientId ?? '',
      durationMin: 60,
      services: [],
    },
  })

  const selectedServices = watch('services')

  useEffect(() => {
    const load = async () => {
      const [pRes, nRes, sRes] = await Promise.all([
        fetch(`/api/patients?orgId=${DEFAULT_ORG_ID}&limit=100`),
        fetch(`/api/users?orgId=${DEFAULT_ORG_ID}&role=nurse`),
        fetch('/api/services'),
      ])
      const [pJson, nJson, sJson] = await Promise.all([pRes.json(), nRes.json(), sRes.json()])
      setPatients(pJson.data ?? [])
      setNurses(nJson.data ?? [])
      setServices((sJson.data ?? []).map((s: { code: string; nameEn: string }) => ({ value: s.code, label: s.nameEn })))
    }
    load()
  }, [])

  const toggleService = (code: string) => {
    const current = selectedServices ?? []
    setValue(
      'services',
      current.includes(code) ? current.filter(c => c !== code) : [...current, code],
      { shouldValidate: true }
    )
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setServerError(null)
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId:      DEFAULT_ORG_ID,
          patientId:  data.patientId,
          nurseId:    data.nurseId || undefined,
          visitType:  data.visitType,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
          durationMin: data.durationMin,
          notes:       data.notes,
          tasks:       data.services.map(code => ({ serviceCode: code })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setServerError(JSON.stringify(json.error)); return }
      router.push(`/visits/${json.data.id}`)
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <Card>
        <h3 className="mb-4">Visit Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Patient" required
            {...register('patientId')}
            placeholder="Select patient…"
            options={patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.mrn})` }))}
            error={errors.patientId?.message}
            className="col-span-2"
          />
          <Select
            label="Visit Type" required
            {...register('visitType')}
            placeholder="Select type…"
            options={VISIT_TYPES}
            error={errors.visitType?.message}
          />
          <Select
            label="Assign Nurse"
            {...register('nurseId')}
            placeholder="Unassigned"
            options={nurses.map(n => ({ value: n.id, label: `${n.firstName} ${n.lastName}` }))}
          />
          <Input
            label="Scheduled Date & Time" required
            type="datetime-local"
            {...register('scheduledAt')}
            error={errors.scheduledAt?.message}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            min={15} max={480} step={15}
            {...register('durationMin', { valueAsNumber: true })}
            error={errors.durationMin?.message}
          />
          <div className="col-span-2">
            <label className="text-xs font-medium text-brand-dark block mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red"
              placeholder="Special instructions or notes…"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-1">Services</h3>
        <p className="text-xs text-brand-muted mb-4">Select services to be performed during this visit</p>
        {errors.services && <p className="text-xs text-red-600 mb-3">{errors.services.message}</p>}
        <div className="grid grid-cols-2 gap-2">
          {services.map(s => {
            const checked = selectedServices?.includes(s.value)
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleService(s.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                  checked
                    ? 'border-brand-red bg-brand-red/5 text-brand-red font-medium'
                    : 'border-brand-border bg-white text-brand-dark hover:border-brand-red/40'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-brand-red border-brand-red' : 'border-brand-border'}`}>
                  {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                {s.label}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={saving}>Schedule Visit</Button>
      </div>
    </form>
  )
}
