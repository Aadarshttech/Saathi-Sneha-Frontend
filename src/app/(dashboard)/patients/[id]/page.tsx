import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fullName } from '@/lib/utils'
import PatientChartClient from './patient-chart-client'
import prisma from '@/lib/prisma'

export const metadata: Metadata = { title: 'Patient Chart' }

async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      branch:        { select: { id: true, name: true } },
      primaryNurse:  { select: { id: true, firstName: true, lastName: true, phone: true } },
      primaryDoctor: { select: { id: true, firstName: true, lastName: true, phone: true } },
      diagnoses:     { orderBy: { isPrimary: 'desc' } },
      familyMembers: { orderBy: { isPrimaryContact: 'desc' } },
      visits: {
        orderBy: { scheduledAt: 'desc' },
        take: 20,
        include: {
          nurse: { select: { id: true, firstName: true, lastName: true } },
          tasks: { select: { id: true, serviceCode: true, status: true } },
        },
      },
      medications:   { orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] },
      labResults:    { orderBy: [{ panelDate: 'desc' }, { testName: 'asc' }] },
      vaccinations:  { orderBy: { vaccineName: 'asc' } },
      referrals:     { orderBy: { referralDate: 'desc' } },
      alerts:        { where: { isResolved: false }, orderBy: { createdAt: 'desc' } },
      carePlanGoals: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] },
      cgaAssessments: {
        orderBy: { assessedAt: 'desc' },
        take: 10,
        include: { assessedBy: { select: { firstName: true, lastName: true } } },
      },
      subscriptions: {
        where: { status: { in: ['active', 'trial', 'paused'] } },
        include: { plan: true },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
      invoices: {
        include: {
          lineItems: { orderBy: { id: 'asc' } },
          payments:  { orderBy: { paidAt: 'desc' } },
        },
        orderBy: { invoiceDate: 'desc' },
        take: 20,
      },
    },
  })
}

async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: 'asc' },
    take: 100,
  })
}

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const [patient, users] = await Promise.all([getPatient(params.id), getUsers()])
  if (!patient) notFound()

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark mb-3">
          <ChevronLeft className="w-4 h-4" /> Patients
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{fullName(patient)}</h1>
            {(patient.firstNameNepali || patient.lastNameNepali) && (
              <p className="text-sm text-brand-muted mt-0.5">
                {[patient.lastNameNepali, patient.firstNameNepali].filter(Boolean).join(' ')}
              </p>
            )}
            <p className="text-sm text-brand-muted font-mono mt-0.5">{patient.mrn}</p>
          </div>
          <Link href={`/visits/new?patientId=${patient.id}`}>
            <Button size="sm"><Plus className="w-3.5 h-3.5" /> Schedule Visit</Button>
          </Link>
        </div>
      </div>

      <PatientChartClient
    patient={{
      ...(patient as object),
      cgaAssessments: patient.cgaAssessments.map(cga => ({
        ...cga,
        tugSeconds: cga.tugSeconds != null ? Number(cga.tugSeconds) : null,
        bmi:        cga.bmi        != null ? Number(cga.bmi)        : null,
      })),
      subscription: patient.subscriptions[0] ? {
        id:          patient.subscriptions[0].id,
        status:      patient.subscriptions[0].status,
        priceNpr:    patient.subscriptions[0].priceNpr,
        startDate:   patient.subscriptions[0].startDate.toISOString(),
        renewalDate: patient.subscriptions[0].renewalDate?.toISOString() ?? null,
        payerType:   patient.subscriptions[0].payerType,
        payerName:   patient.subscriptions[0].payerName ?? null,
        payerPhone:  patient.subscriptions[0].payerPhone ?? null,
        plan: {
          id:             patient.subscriptions[0].plan.id,
          code:           patient.subscriptions[0].plan.code,
          name:           patient.subscriptions[0].plan.name,
          priceMinNpr:    patient.subscriptions[0].plan.priceMinNpr,
          priceMaxNpr:    patient.subscriptions[0].plan.priceMaxNpr,
          visitsPerMonth: patient.subscriptions[0].plan.visitsPerMonth,
          features:       patient.subscriptions[0].plan.features.slice(),
        },
      } : null,
      invoices: patient.invoices.map(inv => ({
        id:          inv.id,
        invoiceNo:   inv.invoiceNo,
        invoiceDate: inv.invoiceDate.toISOString(),
        dueDate:     inv.dueDate.toISOString(),
        status:      inv.status,
        totalNpr:    inv.totalNpr,
        paidNpr:     inv.paidNpr,
        payerType:   inv.payerType,
        lineItems:   inv.lineItems.map(li => ({
          id:           li.id,
          description:  li.description,
          category:     li.category,
          qty:          li.qty,
          unitPriceNpr: li.unitPriceNpr,
          totalNpr:     li.totalNpr,
        })),
        payments: inv.payments.map(p => ({
          id:         p.id,
          amountNpr:  p.amountNpr,
          method:     p.method,
          payerType:  p.payerType,
          payerName:  p.payerName ?? null,
          paidAt:     p.paidAt.toISOString(),
        })),
      })),
    } as never}
    users={users}
  />
    </div>
  )
}
