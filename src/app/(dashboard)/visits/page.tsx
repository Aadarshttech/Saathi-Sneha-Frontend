import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import VisitListClient from './visit-list-client'

export const metadata: Metadata = { title: 'Visits' }

export default function VisitsPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1>Visits</h1>
          <p className="text-sm text-brand-muted mt-0.5">Provider queue and visit management</p>
        </div>
        <Link href="/visits/new">
          <Button size="md">
            <Plus className="w-4 h-4" />
            Schedule Visit
          </Button>
        </Link>
      </div>
      <Suspense fallback={<div className="text-gray-400 py-4">Loading visits…</div>}>
        <VisitListClient />
      </Suspense>
    </div>
  )
}
