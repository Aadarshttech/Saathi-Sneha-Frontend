import type { Metadata } from 'next'
import ServicesClient from './services-client'
import prisma from '@/lib/prisma'

export const metadata: Metadata = { title: 'Services' }

export default async function ServicesPage() {
  const [rawPlans, rawServices] = await Promise.all([
    prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.serviceCatalog.findMany({ orderBy: [{ category: 'asc' }, { nameEn: 'asc' }] }),
  ])

  const initialPlans = rawPlans.map(p => ({
    id: p.id, code: p.code, name: p.name,
    nameNepali: p.nameNepali ?? null, description: p.description ?? null,
    bestFor: p.bestFor ?? null, features: p.features.slice(),
    priceMinNpr: p.priceMinNpr, priceMaxNpr: p.priceMaxNpr,
    visitsPerMonth: p.visitsPerMonth, isActive: p.isActive, sortOrder: p.sortOrder,
  }))

  const initialServices = rawServices.map(s => ({
    code: s.code, category: s.category, nameEn: s.nameEn, nameNp: s.nameNp ?? null,
    descriptionEn: s.descriptionEn, defaultDurationMin: s.defaultDurationMin,
    basePriceNpr: s.basePriceNpr != null ? Number(s.basePriceNpr) : null,
    isSameDay: s.isSameDay, requiresNurse: s.requiresNurse,
    requiresProvider: s.requiresProvider, requiresCaregiver: s.requiresCaregiver,
    isActive: s.isActive,
  }))

  return <ServicesClient initialPlans={initialPlans} initialServices={initialServices} />
}
