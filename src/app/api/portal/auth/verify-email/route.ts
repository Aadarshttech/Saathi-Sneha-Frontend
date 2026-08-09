import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encodeSession, PORTAL_COOKIE } from '@/lib/portal-auth'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

  if (!token) {
    return NextResponse.redirect(`${appUrl}/portal/login?error=invalid_token`)
  }

  // Look up by token first (covers not-yet-verified accounts), falling back to an
  // already-verified account whose token has since been superseded by a newer signup
  // attempt — keeps this endpoint idempotent against email-scanner link pre-fetching
  // and double-clicks, which would otherwise burn the token before the real user clicks.
  const account = await prisma.caregiverAccount.findUnique({ where: { verificationToken: token } })

  if (!account) {
    return NextResponse.redirect(`${appUrl}/portal/signup?error=invalid_token`)
  }
  if (!account.emailVerified) {
    if (!account.verificationTokenExpiresAt || account.verificationTokenExpiresAt < new Date()) {
      return NextResponse.redirect(`${appUrl}/portal/signup?error=expired_token&email=${encodeURIComponent(account.email)}`)
    }
    await prisma.caregiverAccount.update({
      where: { id: account.id },
      data:  { emailVerified: true, lastLoginAt: new Date() },
    })
  }

  const nameParts = account.fullName.trim().split(/\s+/)
  const firstName = nameParts[0] ?? account.fullName
  const lastName  = nameParts.slice(1).join(' ')

  const sessionToken = encodeSession({
    caregiverAccountId: account.id,
    patientId: null,
    firstName,
    lastName,
  })

  const res = NextResponse.redirect(`${appUrl}/portal/onboarding`)
  res.cookies.set(PORTAL_COOKIE, sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60,
    path:     '/',
  })
  return res
}
