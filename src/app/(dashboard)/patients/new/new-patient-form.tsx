'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NEPAL_PROVINCES, BLOOD_GROUPS, INSURANCE_SCHEMES, DEFAULT_ORG_ID } from '@/lib/constants'

const schema = z.object({
  firstName:    z.string().min(1, 'Required'),
  lastName:     z.string().min(1, 'Required'),
  firstNameNepali: z.string().optional(),
  lastNameNepali:  z.string().optional(),
  dateOfBirth:  z.string().min(1, 'Required'),
  gender:       z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  phone:        z.string().min(7, 'Required'),
  altPhone:     z.string().optional(),
  email:        z.string().email().optional().or(z.literal('')),
  bloodGroup:   z.string().optional(),
  province:     z.string().optional(),
  district:     z.string().optional(),
  municipality: z.string().optional(),
  streetAddress: z.string().optional(),
  insuranceScheme: z.enum(['none', 'nsia', 'sehat_bima', 'ssf', 'private']).optional(),
  insurancePolicyNo: z.string().optional(),
  emergencyContactName:     z.string().optional(),
  emergencyContactPhone:    z.string().optional(),
  emergencyContactRelation: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewPatientForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'male', insuranceScheme: 'none' },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setServerError(null)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, orgId: DEFAULT_ORG_ID }),
      })
      const json = await res.json()
      if (!res.ok) { setServerError(JSON.stringify(json.error)); return }
      router.push(`/patients/${json.data.id}`)
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

      {/* Personal Info */}
      <Card>
        <h3 className="mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required {...register('firstName')} error={errors.firstName?.message} />
          <Input label="Last Name"  required {...register('lastName')}  error={errors.lastName?.message} />
          <Input label="First Name (Nepali)" {...register('firstNameNepali')} />
          <Input label="Last Name (Nepali)"  {...register('lastNameNepali')} />
          <Input label="Date of Birth" type="date" required {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
          <Select
            label="Gender" required
            {...register('gender')}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say' },
            ]}
            error={errors.gender?.message}
          />
          <Select
            label="Blood Group"
            {...register('bloodGroup')}
            placeholder="Select…"
            options={BLOOD_GROUPS.map(b => ({ value: b, label: b }))}
          />
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <h3 className="mb-4">Contact Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" required {...register('phone')} error={errors.phone?.message} placeholder="+977 98XXXXXXXX" />
          <Input label="Alt Phone" {...register('altPhone')} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} className="col-span-2" />
        </div>
      </Card>

      {/* Address */}
      <Card>
        <h3 className="mb-4">Address</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Province"
            {...register('province')}
            placeholder="Select province…"
            options={[...NEPAL_PROVINCES]}
          />
          <Input label="District" {...register('district')} />
          <Input label="Municipality / VDC" {...register('municipality')} />
          <Input label="Street Address" {...register('streetAddress')} className="col-span-2" />
        </div>
      </Card>

      {/* Insurance */}
      <Card>
        <h3 className="mb-4">Insurance</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Insurance Scheme"
            {...register('insuranceScheme')}
            options={[...INSURANCE_SCHEMES]}
          />
          <Input label="Policy / Card Number" {...register('insurancePolicyNo')} />
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <h3 className="mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" {...register('emergencyContactName')} />
          <Input label="Phone" {...register('emergencyContactPhone')} />
          <Input label="Relationship" {...register('emergencyContactRelation')} />
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={saving}>Register Patient</Button>
      </div>
    </form>
  )
}
