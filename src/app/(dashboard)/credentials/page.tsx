import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import CredentialsClient from './credentials-client'

export const metadata: Metadata = { title: 'Staff Credentials' }

export default async function CredentialsPage() {
  const users = await prisma.user.findMany({
    where:   { orgId: DEFAULT_ORG_ID, role: { in: ['provider', 'lab_tech'] } },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    select:  { id: true, firstName: true, lastName: true, email: true, role: true, passwordHash: true },
  })

  const staff = users.map(u => ({
    id:          u.id,
    firstName:   u.firstName,
    lastName:    u.lastName,
    email:       u.email ?? '',
    role:        u.role,
    hasPassword: !!u.passwordHash,
  }))

  return <CredentialsClient staff={staff} />
}
