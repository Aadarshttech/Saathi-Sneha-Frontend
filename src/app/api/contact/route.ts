import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { rateLimit, getIp } from '@/lib/rate-limit'

const CONTACT_INBOX = process.env.CONTACT_TO_EMAIL || 'info@saathisnehacare.com'
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email().max(200),
  phone:   z.string().max(50).optional(),
  plan:    z.string().max(100).optional(),
  goal:    z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(), // honeypot — must be empty
})

export async function POST(request: Request) {
  // Rate limit: 5 submissions per IP per hour
  const { allowed } = rateLimit(`contact:${getIp(request)}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }

  // Honeypot: if the hidden `website` field is filled, it's a bot — silently succeed
  if (parsed.data.website) {
    return NextResponse.json({ ok: true })
  }

  const { name, email, phone, plan, goal, message } = parsed.data

  if (!resend) {
    console.error('[contact-form] RESEND_API_KEY not set — email not sent', { name, email })
    return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
  }

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const { error } = await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL || 'Saathi Sneha Care <onboarding@resend.dev>',
    to:      CONTACT_INBOX,
    replyTo: email,
    subject: `New contact form submission from ${name}`,
    html: `
      <p><strong>Name:</strong> ${escape(name)}</p>
      <p><strong>Email:</strong> ${escape(email)}</p>
      ${phone ? `<p><strong>Phone:</strong> ${escape(phone)}</p>` : ''}
      ${plan ? `<p><strong>Interested Plan:</strong> ${escape(plan)}</p>` : ''}
      ${goal ? `<p><strong>Reason:</strong> ${escape(goal)}</p>` : ''}
      <p><strong>Message:</strong><br/>${escape(message).replace(/\n/g, '<br/>')}</p>
    `,
  })

  if (error) {
    console.error('[contact-form] Resend error', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
