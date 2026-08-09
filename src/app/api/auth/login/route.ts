import { NextRequest, NextResponse } from 'next/server'
import { encodeAdminSession, ADMIN_COOKIE } from '@/lib/admin-auth'
import { rateLimit, getIp } from '@/lib/rate-limit'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn('[admin-login] ADMIN_USERNAME / ADMIN_PASSWORD env vars are not set — admin login is disabled')
}

export async function POST(request: NextRequest) {
  const { allowed } = rateLimit(`admin-login:${getIp(request)}`, { limit: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait 15 minutes.' }, { status: 429 })
  }

  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(
    ADMIN_COOKIE,
    encodeAdminSession({ username }),
    { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60, path: '/' },
  )
  return res
}
