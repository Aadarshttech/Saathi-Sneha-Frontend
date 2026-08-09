import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NewPatientForm from './new-patient-form'

export const metadata: Metadata = { title: 'New Patient' }

export default function NewPatientPage() {
  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div>
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to Patients
        </Link>
        <h1>New Patient</h1>
        <p className="text-sm text-brand-muted mt-0.5">Register a new patient record</p>
      </div>
      <NewPatientForm />
    </div>
  )
}
