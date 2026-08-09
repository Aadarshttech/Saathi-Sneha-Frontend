import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getPortalSession, encodeSession, PORTAL_COOKIE } from '@/lib/portal-auth'
import { DEFAULT_ORG_ID } from '@/lib/constants'

const OnboardingSchema = z.object({
  // About You (caregiver)
  phone:                 z.string().optional(),
  country:               z.string().optional(),
  relationshipToPatient: z.string().optional(),
  // About Your Parent (patient)
  firstName:        z.string().min(1),
  lastName:         z.string().min(1),
  firstNameNepali:  z.string().optional(),
  gender:           z.enum(['male', 'female', 'other']),
  dateOfBirth:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  patientPhone:     z.string().optional(),
  patientEmail:     z.string().email().optional().or(z.literal('')),
  bloodGroup:       z.string().optional(),
  allergies:        z.string().optional(),
  chronicConditions: z.string().optional(),
  province:         z.string().optional(),
  district:         z.string().optional(),
  municipality:     z.string().optional(),
  wardNo:           z.number().int().optional(),
  streetAddress:    z.string().optional(),
  emergencyContactName:     z.string().optional(),
  emergencyContactPhone:    z.string().optional(),
  emergencyContactRelation: z.string().optional(),
})

const splitList = (v: string | undefined) =>
  v ? v.split(',').map(s => s.trim()).filter(Boolean) : []

export async function POST(request: NextRequest) {
  const session = getPortalSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = OnboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const d = parsed.data
  const str = (v: string | undefined) => v || undefined

  try {
    const caregiver = await prisma.caregiverAccount.findUniqueOrThrow({
      where: { id: session.caregiverAccountId },
      select: { email: true },
    })

    const [patient] = await prisma.$transaction([
      prisma.patient.create({
        data: {
          orgId:             DEFAULT_ORG_ID,
          mrn:               `SAH-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          caregiverAccountId: session.caregiverAccountId,
          isActive:          true,
          firstName:         d.firstName,
          lastName:          d.lastName,
          firstNameNepali:   str(d.firstNameNepali),
          gender:            d.gender,
          dateOfBirth:       new Date(d.dateOfBirth),
          phone:             str(d.patientPhone),
          email:             str(d.patientEmail) ?? caregiver.email,
          bloodGroup:        str(d.bloodGroup),
          allergies:         splitList(d.allergies),
          chronicConditions: splitList(d.chronicConditions),
          province:          str(d.province) as never,
          district:          str(d.district),
          municipality:      str(d.municipality),
          wardNo:            d.wardNo,
          streetAddress:     str(d.streetAddress),
          emergencyContactName:     str(d.emergencyContactName),
          emergencyContactPhone:    str(d.emergencyContactPhone),
          emergencyContactRelation: str(d.emergencyContactRelation),
        },
      }),
      prisma.caregiverAccount.update({
        where: { id: session.caregiverAccountId },
        data: {
          phone:                 str(d.phone),
          country:               str(d.country),
          relationshipToPatient: str(d.relationshipToPatient),
        },
      }),
    ])

    const token = encodeSession({ ...session, patientId: patient.id })
    const res = NextResponse.json({ ok: true, patientId: patient.id, redirect: '/portal/plans' })
    res.cookies.set(PORTAL_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60,
      path:     '/',
    })
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/portal/onboarding]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
