import { NextResponse } from 'next/server'
import { LAB_PORTAL_COOKIE } from '@/lib/lab-portal-auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(LAB_PORTAL_COOKIE)
  return res
}
