import type { Metadata } from 'next'
import StaffClient from '@/components/staff/staff-client'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export const metadata: Metadata = { title: 'Nurses' }
export const dynamic = 'force-dynamic'

export default async function NursesPage() {
  const raw = await prisma.user.findMany({
    where:   { orgId: DEFAULT_ORG_ID, role: 'nurse' },
    orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }],
    select: {
      id: true, role: true, firstName: true, lastName: true,
      firstNameNepali: true, lastNameNepali: true,
      email: true, phone: true, gender: true, isActive: true,
    },
  })

  const initialStaff = raw.map(u => ({
    id:              u.id,
    role:            u.role,
    firstName:       u.firstName,
    lastName:        u.lastName,
    firstNameNepali: u.firstNameNepali ?? null,
    lastNameNepali:  u.lastNameNepali  ?? null,
    email:           u.email           ?? null,
    phone:           u.phone,
    gender:          u.gender          ?? null,
    isActive:        u.isActive,
  }))

  return <StaffClient role="nurse" initialStaff={initialStaff} />
}
