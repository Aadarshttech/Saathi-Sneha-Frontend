import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/portal-auth'
import { getAdminSession } from '@/lib/admin-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Avoids visually ambiguous characters (0/O, 1/l/I) since this gets typed in by hand.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length)
  return Array.from(bytes, b => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('')
}

export async function POST(request: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, email } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, orgId: DEFAULT_ORG_ID, role: { in: ['provider', 'lab_tech'] } },
  })
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const targetEmail = (email?.trim() || user.email)?.trim()
  if (!targetEmail) {
    return NextResponse.json({ error: 'This staff member has no email on file yet — add one first.' }, { status: 400 })
  }

  if (!resend) {
    console.error('[staff-reset-password] RESEND_API_KEY not set — reset email not sent')
    return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
  }

  const tempPassword = generateTempPassword()

  await prisma.user.update({
    where: { id: userId },
    data: {
      email:        targetEmail,
      passwordHash: await hashPassword(tempPassword),
    },
  })

  const portalName = user.role === 'lab_tech' ? 'Lab Portal' : 'Provider Portal'
  const portalPath  = user.role === 'lab_tech' ? '/lab-portal/login' : '/provider-portal/login'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL || 'Saathi Sneha Care <onboarding@resend.dev>',
    to:      targetEmail,
    subject: `Your ${portalName} password has been reset`,
    html: `
      <p>Hi ${user.firstName},</p>
      <p>Your ${portalName} password was reset by an administrator. Use this temporary password to log in:</p>
      <p style="font-size: 18px; font-weight: bold; letter-spacing: 1px;">${tempPassword}</p>
      <p><a href="${appUrl}${portalPath}">${appUrl}${portalPath}</a></p>
      <p>If you didn't expect this, please contact your administrator right away.</p>
    `,
  })

  if (error) {
    console.error('[staff-reset-password] Resend error', error)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, email: targetEmail })
}
