import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Printer } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { formatMoney, formatDate, formatDateTime, fullName } from '@/lib/utils'
import InvoiceActionClient from './invoice-action-client'
import prisma from '@/lib/prisma'

export const metadata: Metadata = { title: 'Invoice' }

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  partial:   'bg-yellow-50 text-yellow-700',
  overdue:   'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const METHOD_LABELS: Record<string, string> = {
  cash:           'Cash',
  bank_transfer:  'Bank Transfer',
  esewa:          'eSewa',
  khalti:         'Khalti',
  stripe:         'Stripe (Card)',
  cheque:         'Cheque',
}

const PAYER_LABELS: Record<string, string> = {
  family_overseas: 'Overseas Family',
  patient_local:   'Patient / Local',
}

const CATEGORY_LABELS: Record<string, string> = {
  subscription:    'Monthly Subscription',
  nurse_visit:     'Nurse Visit',
  doctor_consult:  'Doctor Consultation',
  lab:             'Lab Services',
  procedure:       'Procedure / Therapy',
  other:           'Other',
}

async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      patient:      { select: { id: true, mrn: true, firstName: true, lastName: true, phone: true } },
      subscription: { include: { plan: { select: { name: true, code: true } } } },
      lineItems:    { orderBy: { id: 'asc' } },
      payments:     { orderBy: { paidAt: 'asc' } },
    },
  })
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id)
  if (!invoice) notFound()

  const outstanding = invoice.totalNpr - invoice.paidNpr
  const canPay      = outstanding > 0 && invoice.status !== 'cancelled'

  return (
    <div className="p-6 space-y-5">
      <div>
        <Link href="/billing" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark mb-3">
          <ChevronLeft className="w-4 h-4" /> Billing
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{invoice.invoiceNo}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_BADGE[invoice.status] ?? STATUS_BADGE.draft}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-sm text-brand-muted mt-0.5">
              <Link href={`/patients/${invoice.patient.id}`} className="hover:underline text-brand-blue">
                {fullName(invoice.patient)}
              </Link>
              {' '}· {invoice.patient.mrn}
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark border border-brand-border rounded-lg px-3 py-1.5 hover:bg-brand-surface transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Invoice details */}
        <div className="col-span-2 space-y-4">
          {/* Header info */}
          <Card>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-brand-muted mb-1">Invoice Date</p>
                <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted mb-1">Due Date</p>
                <p className={`font-medium ${invoice.status === 'overdue' ? 'text-red-600' : ''}`}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted mb-1">Payer</p>
                <p className="font-medium">{PAYER_LABELS[invoice.payerType]}</p>
              </div>
              {invoice.subscription && (
                <div className="col-span-3">
                  <p className="text-xs text-brand-muted mb-1">Subscription</p>
                  <p className="font-medium">{invoice.subscription.plan.name}</p>
                </div>
              )}
              {invoice.notes && (
                <div className="col-span-3">
                  <p className="text-xs text-brand-muted mb-1">Notes</p>
                  <p>{invoice.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Line items */}
          <Card padding="none">
            <CardHeader><h3>Line Items</h3></CardHeader>
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-brand-surface border-b border-brand-border">
                  <tr className="text-xs text-brand-muted">
                    <th className="text-left px-5 py-2.5 font-medium">Description</th>
                    <th className="text-left px-3 py-2.5 font-medium">Category</th>
                    <th className="text-center px-3 py-2.5 font-medium">Qty</th>
                    <th className="text-right px-3 py-2.5 font-medium">Unit Price</th>
                    <th className="text-right px-5 py-2.5 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {invoice.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-5 py-3 font-medium">{item.description}</td>
                      <td className="px-3 py-3 text-brand-muted text-xs">{CATEGORY_LABELS[item.category] ?? item.category}</td>
                      <td className="px-3 py-3 text-center">{item.qty}</td>
                      <td className="px-3 py-3 text-right text-brand-muted">{formatMoney(item.unitPriceNpr)}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatMoney(item.totalNpr)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-surface border-t border-brand-border">
                  <tr>
                    <td colSpan={4} className="px-5 py-2 text-right text-sm text-brand-muted">Subtotal</td>
                    <td className="px-5 py-2 text-right text-sm">{formatMoney(invoice.subtotalNpr)}</td>
                  </tr>
                  {invoice.discountNpr > 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-2 text-right text-sm text-green-600">Discount</td>
                      <td className="px-5 py-2 text-right text-sm text-green-600">−{formatMoney(invoice.discountNpr)}</td>
                    </tr>
                  )}
                  {invoice.taxNpr > 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-2 text-right text-sm text-brand-muted">Tax</td>
                      <td className="px-5 py-2 text-right text-sm">{formatMoney(invoice.taxNpr)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-brand-border">
                    <td colSpan={4} className="px-5 py-3 text-right font-bold">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-lg">{formatMoney(invoice.totalNpr)}</td>
                  </tr>
                  {invoice.paidNpr > 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-2 text-right text-sm text-green-600">Paid</td>
                      <td className="px-5 py-2 text-right text-sm text-green-600">−{formatMoney(invoice.paidNpr)}</td>
                    </tr>
                  )}
                  {outstanding > 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-2 text-right font-semibold text-red-600">Outstanding</td>
                      <td className="px-5 py-2 text-right font-semibold text-red-600">{formatMoney(outstanding)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <Card padding="none">
              <CardHeader><h3>Payment History</h3></CardHeader>
              <CardBody className="space-y-2">
                {invoice.payments.map(p => (
                  <div key={p.id} className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{formatMoney(p.amountNpr)}</p>
                      <p className="text-xs text-brand-muted">
                        {METHOD_LABELS[p.method]} · {PAYER_LABELS[p.payerType]}
                        {p.payerName ? ` · ${p.payerName}` : ''}
                        {p.referenceNo ? ` · Ref: ${p.referenceNo}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-brand-muted">{formatDateTime(p.paidAt)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right panel: actions */}
        <div className="space-y-4">
          {/* Summary card */}
          <Card>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-brand-dark">{formatMoney(invoice.totalNpr)}</p>
              {invoice.paidNpr > 0 && invoice.paidNpr < invoice.totalNpr && (
                <p className="text-sm text-yellow-600 mt-1">{formatMoney(outstanding)} outstanding</p>
              )}
              {invoice.status === 'paid' && (
                <p className="text-sm text-green-600 font-medium mt-1">Paid in full</p>
              )}
            </div>
          </Card>

          {/* Record payment */}
          {canPay && (
            <InvoiceActionClient
              invoiceId={invoice.id}
              outstanding={outstanding}
              defaultPayerType={invoice.payerType}
            />
          )}

          {/* Patient link */}
          <Card>
            <h3 className="mb-3 text-sm">Patient</h3>
            <Link href={`/patients/${invoice.patient.id}`} className="text-sm text-brand-blue hover:underline font-medium">
              {fullName(invoice.patient)}
            </Link>
            <p className="text-xs text-brand-muted mt-0.5 font-mono">{invoice.patient.mrn}</p>
            {invoice.patient.phone && <p className="text-xs text-brand-muted mt-1">{invoice.patient.phone}</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
