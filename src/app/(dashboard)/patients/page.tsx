import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PatientListClient from './patient-list-client'

export const metadata: Metadata = { title: 'Patients' }

export default function PatientsPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1>Patients</h1>
          <p className="text-sm text-brand-muted mt-0.5">Search and manage patient records</p>
        </div>
        <Link href="/patients/new">
          <Button size="md">
            <Plus className="w-4 h-4" />
            New Patient
          </Button>
        </Link>
      </div>
      <PatientListClient />
    </div>
  )
}
