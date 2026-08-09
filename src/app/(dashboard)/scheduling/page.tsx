import type { Metadata } from 'next'
import SchedulingClient from './scheduling-client'
import prisma from '@/lib/prisma'
import { DEFAULT_ORG_ID } from '@/lib/constants'

export const metadata: Metadata = { title: 'Scheduling' }
export const dynamic = 'force-dynamic'

export default async function SchedulingPage() {
  const orgId = DEFAULT_ORG_ID
  const now   = new Date()
  // Load visits ±60 days so week navigation works without a refetch
  const rangeStart = new Date(now); rangeStart.setDate(now.getDate() - 30)
  const rangeEnd   = new Date(now); rangeEnd.setDate(now.getDate() + 90)

  const [rawProviders, rawNurses, rawVisits] = await Promise.all([
    prisma.user.findMany({
      where: { orgId, role: 'provider', isActive: true },
      orderBy: { lastName: 'asc' },
      select: {
        id: true, role: true, firstName: true, lastName: true,
        firstNameNepali: true, lastNameNepali: true,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
        },
        timeOff: {
          where:   { date: { gte: rangeStart } },
          orderBy: { date: 'asc' },
          select:  { id: true, date: true, reason: true, isFullDay: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { orgId, role: 'nurse', isActive: true },
      orderBy: { lastName: 'asc' },
      select: {
        id: true, role: true, firstName: true, lastName: true,
        firstNameNepali: true, lastNameNepali: true,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
        },
        timeOff: {
          where:   { date: { gte: rangeStart } },
          orderBy: { date: 'asc' },
          select:  { id: true, date: true, reason: true, isFullDay: true },
        },
      },
    }),
    prisma.visit.findMany({
      where: {
        orgId,
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true, scheduledAt: true, status: true, serviceCode: true,
        nurseId: true, providerId: true,
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ])

  const serialize = (u: typeof rawProviders[0]) => ({
    id:              u.id,
    role:            u.role as 'provider' | 'nurse',
    firstName:       u.firstName,
    lastName:        u.lastName,
    firstNameNepali: u.firstNameNepali ?? null,
    lastNameNepali:  u.lastNameNepali  ?? null,
    availability: u.availability.map(a => ({
      id: a.id, dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime, isActive: a.isActive,
    })),
    timeOff: u.timeOff.map(t => ({
      id: t.id, date: t.date.toISOString().substring(0, 10), reason: t.reason ?? null, isFullDay: t.isFullDay,
    })),
  })

  const visits = rawVisits.map(v => ({
    id:          v.id,
    scheduledAt: v.scheduledAt.toISOString(),
    status:      v.status,
    serviceCode: v.serviceCode ?? null,
    nurseId:     v.nurseId    ?? null,
    providerId:  v.providerId ?? null,
    patient: { id: v.patient.id, firstName: v.patient.firstName, lastName: v.patient.lastName },
  }))

  return (
    <SchedulingClient
      initialProviders={rawProviders.map(serialize)}
      initialNurses={rawNurses.map(serialize)}
      visits={visits}
    />
  )
}
