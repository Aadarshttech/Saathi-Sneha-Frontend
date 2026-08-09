import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, encodeSession, PORTAL_COOKIE } from '@/lib/portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per IP per 15 minutes (brute-force protection)
  const { allowed } = rateLimit(`login:${getIp(request)}`, { limit: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait 15 minutes.' }, { status: 429 })
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const account = await prisma.caregiverAccount.findUnique({ where: { email } })

  if (!account) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }
  if (!account.emailVerified) {
    return NextResponse.json(
      { error: 'Please verify your email first. Check your inbox, or sign up again to resend the link.', code: 'EMAIL_NOT_VERIFIED' },
      { status: 403 }
    )
  }
  if (!await verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const patients = await prisma.patient.findMany({
    where:   { caregiverAccountId: account.id, orgId: DEFAULT_ORG_ID, isActive: true },
    select:  { id: true },
    orderBy: { createdAt: 'asc' },
  })

  const patientId = patients.length === 1 ? patients[0].id : null
  const redirectTo =
    patients.length === 0 ? '/portal/onboarding' :
    patients.length === 1 ? '/portal/dashboard' :
    '/portal/select-patient'

  await prisma.caregiverAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } })

  const nameParts = account.fullName.trim().split(/\s+/)
  const token = encodeSession({
    caregiverAccountId: account.id,
    patientId,
    firstName: nameParts[0] ?? account.fullName,
    lastName:  nameParts.slice(1).join(' '),
  })

  const res = NextResponse.json({ ok: true, redirect: redirectTo })
  res.cookies.set(PORTAL_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60,
    path:     '/',
  })
  return res
}
