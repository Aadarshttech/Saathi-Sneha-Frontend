import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { role, firstName, lastName, phone, firstNameNepali, lastNameNepali, email, gender, isActive } = body

  if (!role || !['provider', 'nurse'].includes(role))
    return NextResponse.json({ error: 'role must be provider or nurse' }, { status: 400 })
  if (!firstName?.trim() || !lastName?.trim())
    return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
  if (!phone?.trim())
    return NextResponse.json({ error: 'phone is required' }, { status: 400 })

  try {
    const user = await prisma.user.create({
      data: {
        orgId:           DEFAULT_ORG_ID,
        role,
        firstName:       firstName.trim(),
        lastName:        lastName.trim(),
        firstNameNepali: firstNameNepali?.trim() || null,
        lastNameNepali:  lastNameNepali?.trim()  || null,
        email:           email?.trim()            || null,
        phone:           phone.trim(),
        gender:          gender                   || null,
        isActive:        isActive ?? true,
        preferredLanguage: 'ne',
      },
      select: {
        id: true, role: true, firstName: true, lastName: true,
        firstNameNepali: true, lastNameNepali: true,
        email: true, phone: true, gender: true, isActive: true,
        dateOfBirth: true,
      },
    })
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002')
      return NextResponse.json({ error: 'Phone or email already registered' }, { status: 409 })
    if (err.code === 'P2003')
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
