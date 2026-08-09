import { NextResponse } from 'next/server'
import { PROVIDER_PORTAL_COOKIE } from '@/lib/provider-portal-auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(PROVIDER_PORTAL_COOKIE)
  return res
}
