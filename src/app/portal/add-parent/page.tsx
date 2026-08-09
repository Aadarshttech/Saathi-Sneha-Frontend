import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'
import AddParentForm from './add-parent-form'

export default function AddParentPage() {
  const session = getPortalSession()
  if (!session) redirect('/portal/login')

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add Another Parent</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add details for another parent to arrange their care too.
          </p>
        </div>
        <AddParentForm />
      </div>
    </div>
  )
}
