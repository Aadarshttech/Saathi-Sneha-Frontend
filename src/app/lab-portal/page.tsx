import { redirect } from 'next/navigation'
import { getLabSession } from '@/lib/lab-portal-auth'

export default function LabPortalRootPage() {
  const session = getLabSession()
  if (session) redirect('/lab-portal/dashboard')
  redirect('/lab-portal/login')
}
