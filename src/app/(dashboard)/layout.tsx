import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import prisma from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession()
  if (!session) redirect('/login')

  const admin = await prisma.user.findFirst({
    where:   { role: { in: ['admin', 'provider', 'nurse'] }, isActive: true },
    orderBy: { createdAt: 'asc' },
    include: { branch: { select: { name: true } } },
  })

  const user = admin
    ? { firstName: admin.firstName, lastName: admin.lastName, role: admin.role, branchName: admin.branch?.name ?? null }
    : undefined

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-brand-surface">
        {children}
      </main>
    </div>
  )
}
