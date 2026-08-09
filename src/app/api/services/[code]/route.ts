import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  const body = await req.json()

  const service = await prisma.serviceCatalog.update({
    where: { code: params.code as never },
    data: {
      ...(body.nameEn            != null && { nameEn:             String(body.nameEn) }),
      ...(body.nameNp            !== undefined && { nameNp:              body.nameNp || null }),
      ...(body.descriptionEn     != null && { descriptionEn:      String(body.descriptionEn) }),
      ...(body.defaultDurationMin != null && { defaultDurationMin: Number(body.defaultDurationMin) }),
      ...(body.basePriceNpr      !== undefined && { basePriceNpr: body.basePriceNpr != null ? Number(body.basePriceNpr) : null }),
      ...(body.isSameDay         != null && { isSameDay:          Boolean(body.isSameDay) }),
      ...(body.requiresNurse     != null && { requiresNurse:      Boolean(body.requiresNurse) }),
      ...(body.requiresProvider  != null && { requiresProvider:   Boolean(body.requiresProvider) }),
      ...(body.requiresCaregiver != null && { requiresCaregiver:  Boolean(body.requiresCaregiver) }),
      ...(body.isActive          != null && { isActive:           Boolean(body.isActive) }),
    },
  })

  return NextResponse.json({ data: service })
}
