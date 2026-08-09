import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encodeProviderSession, PROVIDER_PORTAL_COOKIE } from '@/lib/provider-portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where:  { id: userId, orgId: DEFAULT_ORG_ID, role: 'provider' },
    select: { id: true, firstName: true, lastName: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(
    PROVIDER_PORTAL_COOKIE,
    encodeProviderSession({ userId: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role }),
    { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60, path: '/' },
  )
  return res
}
