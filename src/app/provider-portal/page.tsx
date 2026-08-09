import { redirect } from 'next/navigation'
import { getProviderSession } from '@/lib/provider-portal-auth'

export default function ProviderPortalRootPage() {
  const session = getProviderSession()
  if (session) redirect('/provider-portal/dashboard')
  redirect('/provider-portal/login')
}
