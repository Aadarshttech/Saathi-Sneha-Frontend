import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { encodeSession, getPortalSession, PORTAL_COOKIE } from '@/lib/portal-auth'
import { getAdminSession } from '@/lib/admin-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const portalSession = getPortalSession()
  const adminSession   = getAdminSession()

  // Only allow an already-authenticated portal user or admin to switch patient context
  if (!portalSession && !adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { patientId } = await request.json()
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  // A portal (caregiver) session may only switch to a patient it actually owns.
  // An admin session (internal staff "view as") is unrestricted, as before.
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      orgId: DEFAULT_ORG_ID,
      isActive: true,
      ...(portalSession ? { caregiverAccountId: portalSession.caregiverAccountId } : {}),
    },
    select: { id: true, firstName: true, lastName: true, caregiverAccountId: true },
  })
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(
    PORTAL_COOKIE,
    encodeSession({
      caregiverAccountId: portalSession?.caregiverAccountId ?? patient.caregiverAccountId ?? '',
      patientId:          patient.id,
      firstName:          portalSession?.firstName ?? patient.firstName,
      lastName:           portalSession?.lastName ?? patient.lastName,
    }),
    {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60,
      path:     '/',
    }
  )
  return res
}
