import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()

  const plan = await prisma.subscriptionPlan.update({
    where: { id: params.id },
    data: {
      ...(body.name        != null && { name:           String(body.name) }),
      ...(body.nameNepali  !== undefined && { nameNepali:    body.nameNepali  || null }),
      ...(body.description !== undefined && { description:   body.description || null }),
      ...(body.bestFor     !== undefined && { bestFor:       body.bestFor     || null }),
      ...(body.features    != null && { features:       body.features }),
      ...(body.priceMinNpr != null && { priceMinNpr:    Number(body.priceMinNpr) }),
      ...(body.priceMaxNpr != null && { priceMaxNpr:    Number(body.priceMaxNpr) }),
      ...(body.visitsPerMonth != null && { visitsPerMonth: Number(body.visitsPerMonth) }),
      ...(body.sortOrder   != null && { sortOrder:      Number(body.sortOrder) }),
      ...(body.isActive    != null && { isActive:       Boolean(body.isActive) }),
    },
  })

  return NextResponse.json({ data: plan })
}
