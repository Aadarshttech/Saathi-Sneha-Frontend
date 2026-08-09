import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'
import { rateLimit, getIp } from '@/lib/rate-limit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  // Rate limit: 10 signup attempts per IP per hour
  const { allowed } = rateLimit(`signup:${getIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const { email, password, fullName } = await request.json()

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  if (!resend) {
    console.error('[portal-signup] RESEND_API_KEY not set — verification email not sent')
    return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
  }

  const existing = await prisma.caregiverAccount.findUnique({ where: { email } })

  if (existing?.emailVerified) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Please log in.' },
      { status: 409 }
    )
  }

  const verificationToken = randomBytes(32).toString('base64url')
  const verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)
  const passwordHash = await hashPassword(password)

  const account = existing
    ? await prisma.caregiverAccount.update({
        where: { id: existing.id },
        data:  { passwordHash, fullName, verificationToken, verificationTokenExpiresAt },
      })
    : await prisma.caregiverAccount.create({
        data: {
          orgId: DEFAULT_ORG_ID,
          email,
          fullName,
          passwordHash,
          verificationToken,
          verificationTokenExpiresAt,
        },
      })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const verifyUrl = `${appUrl}/api/portal/auth/verify-email?token=${account.verificationToken}`

  const { error } = await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL || 'Saathi Sneha Care <onboarding@resend.dev>',
    to:      email,
    subject: 'Verify your email — Saathi Sneha Care',
    html: `
      <p>Hi ${fullName},</p>
      <p>Thanks for signing up for Saathi Sneha Care. Click the link below to verify your email and continue setting up your family's care:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  })

  if (error) {
    console.error('[portal-signup] Resend error', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, email })
}
