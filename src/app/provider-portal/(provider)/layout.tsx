import { redirect } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'
import ProviderNav from '@/components/provider-portal/provider-nav'

export default function ProviderPortalLayout({ children }: { children: React.ReactNode }) {
  const session = getProviderSession()
  if (!session) redirect('/provider-portal/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNav firstName={session.firstName} lastName={session.lastName} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
