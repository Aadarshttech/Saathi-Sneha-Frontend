import { redirect } from 'next/navigation'
import { getLabSession } from '@/lib/lab-portal-auth'
import LabNav from '@/components/lab-portal/lab-nav'

export default function LabPortalLayout({ children }: { children: React.ReactNode }) {
  const session = getLabSession()
  if (!session) redirect('/lab-portal/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <LabNav firstName={session.firstName} lastName={session.lastName} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
