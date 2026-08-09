import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const services = await prisma.serviceCatalog.findMany({
    where: {
      isActive: true,
      ...(category ? { category: category as never } : {}),
    },
    orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
  })

  return NextResponse.json({ data: services })
}
