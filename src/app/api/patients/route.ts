import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreatePatientSchema = z.object({
  firstName:        z.string().min(1),
  lastName:         z.string().min(1),
  firstNameNepali:  z.string().optional(),
  lastNameNepali:   z.string().optional(),
  dateOfBirth:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender:           z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  phone:            z.string().min(7),
  altPhone:         z.string().optional(),
  email:            z.string().email().optional().or(z.literal('')),
  bloodGroup:       z.string().optional(),
  province:         z.string().optional(),
  district:         z.string().optional(),
  municipality:     z.string().optional(),
  wardNo:           z.number().int().optional(),
  streetAddress:    z.string().optional(),
  insuranceScheme:  z.enum(['none', 'nsia', 'sehat_bima', 'ssf', 'private']).optional(),
  insurancePolicyNo: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  primaryNurseId:   z.string().uuid().optional(),
  primaryDoctorId:  z.string().uuid().optional(),
  branchId:         z.string().uuid().optional(),
  orgId:            z.string().optional(),
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveOrgId(raw: string | null): Promise<string | null> {
  if (raw && UUID_RE.test(raw)) return raw
  const org = await prisma.organization.findFirst({ select: { id: true } })
  return org?.id ?? null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const page   = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit  = Math.min(100, Number(searchParams.get('limit') ?? 20))
  const skip   = (page - 1) * limit

  const orgId = await resolveOrgId(searchParams.get('orgId'))
  if (!orgId) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const where = {
    orgId,
    isActive: true,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName:  { contains: search, mode: 'insensitive' as const } },
            { mrn:       { contains: search, mode: 'insensitive' as const } },
            { phone:     { contains: search } },
          ],
        }
      : {}),
  }

  try {
    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, mrn: true, firstName: true, lastName: true,
          firstNameNepali: true, lastNameNepali: true,
          dateOfBirth: true, gender: true, phone: true,
          province: true, district: true, municipality: true,
          isActive: true, createdAt: true,
          primaryNurse:  { select: { id: true, firstName: true, lastName: true } },
          primaryDoctor: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { visits: true } },
        },
      }),
    ])

    return NextResponse.json({ data: patients, total, page, limit })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[GET /api/patients]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreatePatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const d = parsed.data
  const orgId = await resolveOrgId(d.orgId ?? null)
  if (!orgId) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const str = (v: string | undefined) => v || undefined
  try {
    const patient = await prisma.patient.create({
      data: {
        orgId,
        mrn:              `SAH-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        branchId:         d.branchId ?? null,
        firstName:        d.firstName,
        lastName:         d.lastName,
        firstNameNepali:  str(d.firstNameNepali),
        lastNameNepali:   str(d.lastNameNepali),
        dateOfBirth:      new Date(d.dateOfBirth),
        gender:           d.gender as never,
        phone:            d.phone,
        altPhone:         str(d.altPhone),
        email:            str(d.email),
        bloodGroup:       str(d.bloodGroup),
        province:         str(d.province) as never,
        district:         str(d.district),
        municipality:     str(d.municipality),
        wardNo:           d.wardNo,
        streetAddress:    str(d.streetAddress),
        insuranceScheme:  (d.insuranceScheme || undefined) as never,
        insurancePolicyNo: str(d.insurancePolicyNo),
        emergencyContactName:     str(d.emergencyContactName),
        emergencyContactPhone:    str(d.emergencyContactPhone),
        emergencyContactRelation: str(d.emergencyContactRelation),
        primaryNurseId:   d.primaryNurseId,
        primaryDoctorId:  d.primaryDoctorId,
      },
    })
    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/patients]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
