import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/portal-auth'
import { encodeLabSession, LAB_PORTAL_COOKIE } from '@/lib/lab-portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { allowed } = rateLimit(`lab-login:${getIp(request)}`, { limit: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait 15 minutes.' }, { status: 429 })
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where:  { orgId: DEFAULT_ORG_ID, email, role: 'lab_tech' },
    select: { id: true, firstName: true, lastName: true, role: true, passwordHash: true, isActive: true },
  })

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }
  if (!user.isActive) {
    return NextResponse.json({ error: 'Your account has been deactivated. Contact your administrator.' }, { status: 403 })
  }
  if (!await verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(
    LAB_PORTAL_COOKIE,
    encodeLabSession({ userId: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role }),
    { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24 * 60 * 60, path: '/' },
  )
  return res
}
