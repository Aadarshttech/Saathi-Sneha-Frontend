import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.firstName        != null && { firstName:        String(body.firstName).trim() }),
        ...(body.lastName         != null && { lastName:         String(body.lastName).trim() }),
        ...(body.firstNameNepali  !== undefined && { firstNameNepali:  body.firstNameNepali?.trim() || null }),
        ...(body.lastNameNepali   !== undefined && { lastNameNepali:   body.lastNameNepali?.trim()  || null }),
        ...(body.email            !== undefined && { email:            body.email?.trim()            || null }),
        ...(body.phone            != null && { phone:            String(body.phone).trim() }),
        ...(body.gender           !== undefined && { gender:           body.gender || null }),
        ...(body.isActive         != null && { isActive:         Boolean(body.isActive) }),
      },
      select: {
        id: true, role: true, firstName: true, lastName: true,
        firstNameNepali: true, lastNameNepali: true,
        email: true, phone: true, gender: true, isActive: true,
        dateOfBirth: true,
      },
    })
    return NextResponse.json({ data: user })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002')
      return NextResponse.json({ error: 'Phone or email already in use' }, { status: 409 })
    if (err.code === 'P2025')
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}
