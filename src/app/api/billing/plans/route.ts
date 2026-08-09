import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ data: plans })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, name, nameNepali, description, bestFor, features, priceMinNpr, priceMaxNpr, visitsPerMonth, sortOrder } = body

  if (!code || !name || priceMinNpr == null || priceMaxNpr == null) {
    return NextResponse.json({ error: 'code, name, priceMinNpr, priceMaxNpr are required' }, { status: 400 })
  }

  try {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        code:           String(code).toLowerCase().replace(/\s+/g, '_'),
        name:           String(name),
        nameNepali:     nameNepali || null,
        description:    description || null,
        bestFor:        bestFor || null,
        features:       Array.isArray(features) ? features : [],
        priceMinNpr:    Number(priceMinNpr),
        priceMaxNpr:    Number(priceMaxNpr),
        visitsPerMonth: Number(visitsPerMonth) || 0,
        sortOrder:      Number(sortOrder) || 0,
        isActive:       true,
      },
    })
    return NextResponse.json({ data: plan }, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Plan code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
