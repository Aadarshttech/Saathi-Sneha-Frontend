import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/portal-auth'
import { getProviderSession } from '@/lib/provider-portal-auth'
import { getLabSession } from '@/lib/lab-portal-auth'

// Shared by provider-portal and lab-portal — both just update the same User.passwordHash,
// distinguished only by which session cookie is present.
export async function POST(request: NextRequest) {
  const session = getProviderSession() ?? getLabSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.userId },
    select: { id: true, passwordHash: true },
  })
  if (!user?.passwordHash) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
  }

  if (!await verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash: await hashPassword(newPassword) },
  })

  return NextResponse.json({ ok: true })
}
