import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  const role  = searchParams.get('role')

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const users = await prisma.user.findMany({
    where: {
      orgId,
      isActive: true,
      ...(role ? { role: role as never } : {}),
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: {
      id: true, firstName: true, lastName: true, role: true, phone: true, email: true,
    },
  })

  return NextResponse.json({ data: users })
}
