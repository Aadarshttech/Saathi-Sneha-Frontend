import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'

export default function PortalRootPage() {
  const session = getPortalSession()
  if (session) redirect('/portal/dashboard')
  redirect('/portal/login')
}
