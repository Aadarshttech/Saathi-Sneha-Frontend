import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encodeLabSession, LAB_PORTAL_COOKIE } from '@/lib/lab-portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where:  { id: userId, orgId: DEFAULT_ORG_ID, role: 'lab_tech' },
    select: { id: true, firstName: true, lastName: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Lab staff not found' }, { status: 404 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(
    LAB_PORTAL_COOKIE,
    encodeLabSession({ userId: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role }),
    { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60, path: '/' },
  )
  return res
}
