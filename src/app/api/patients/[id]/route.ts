import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdatePatientSchema = z.object({
  firstName:        z.string().min(1).optional(),
  lastName:         z.string().min(1).optional(),
  firstNameNepali:  z.string().optional(),
  lastNameNepali:   z.string().optional(),
  phone:            z.string().min(7).optional(),
  altPhone:         z.string().optional(),
  email:            z.string().email().optional(),
  bloodGroup:       z.string().optional(),
  province:         z.string().optional(),
  district:         z.string().optional(),
  municipality:     z.string().optional(),
  wardNo:           z.number().int().optional(),
  streetAddress:    z.string().optional(),
  insuranceScheme:  z.enum(['none', 'nsia', 'sehat_bima', 'ssf', 'private']).optional(),
  insurancePolicyNo: z.string().optional(),
  emergencyContactName:     z.string().optional(),
  emergencyContactPhone:    z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  primaryNurseId:   z.string().uuid().optional(),
  primaryDoctorId:  z.string().uuid().optional(),
  isActive:         z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      branch:       { select: { id: true, name: true } },
      primaryNurse: { select: { id: true, firstName: true, lastName: true, phone: true } },
      primaryDoctor:{ select: { id: true, firstName: true, lastName: true, phone: true } },
      diagnoses:    { select: { id: true, icdCode: true, description: true, isPrimary: true, resolvedAt: true } },
      familyMembers:{ select: { id: true, fullName: true, relationship: true, phone: true, country: true, isPrimaryContact: true } },
      visits: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        select: {
          id: true, visitType: true, status: true, scheduledAt: true, completedAt: true,
          nurse: { select: { id: true, firstName: true, lastName: true } },
          tasks: { select: { id: true, serviceCode: true, status: true } },
        },
      },
    },
  })

  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  return NextResponse.json({ data: patient })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = UpdatePatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data:  parsed.data as never,
  })

  return NextResponse.json({ data: patient })
}
