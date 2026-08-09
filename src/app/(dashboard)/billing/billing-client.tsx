'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp, Users, AlertCircle, CreditCard, Banknote,
  CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronRight,
  X, Search, Loader2, Smartphone, RefreshCw,
} from 'lucide-react'
import { Card, StatCard } from '@/components/ui/card'
import { formatMoney, formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Stats {
  activeSubscriptions: number
  monthlyRevenueNpr:   number
  pendingNpr:          number
  overdueInvoices:     number
}

export interface InvoiceLineItem {
  id: string; description: string; category: string
  qty: number; unitPriceNpr: number; totalNpr: number
}

export interface InvoicePayment {
  id: string; amountNpr: number; method: string; payerName: string | null; paidAt: string
}

export interface InvoiceData {
  id: string; invoiceNo: string; invoiceDate: string; dueDate: string
  status: string; totalNpr: number; paidNpr: number; payerType: string
  patient: { id: string; firstName: string; lastName: string }
  planName: string | null; planCode: string | null
  lineItems: InvoiceLineItem[]
  payments:  InvoicePayment[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',    icon: Clock },
  sent:      { label: 'Sent',      color: 'bg-blue-50 text-blue-700',     icon: Clock },
  paid:      { label: 'Paid',      color: 'bg-green-50 text-green-700',   icon: CheckCircle2 },
  partial:   { label: 'Partial',   color: 'bg-yellow-50 text-yellow-700', icon: AlertTriangle },
  overdue:   { label: 'Overdue',   color: 'bg-red-50 text-red-700',       icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',    icon: Clock },
}

const KNOWN_PLAN_COLORS: Record<string, string> = {
  care_connect:      'bg-blue-50 text-blue-700 border-blue-200',
  wellness_plus:     'bg-green-50 text-green-700 border-green-200',
  chronic_care:      'bg-purple-50 text-purple-700 border-purple-200',
  recovery_care:     'bg-orange-50 text-orange-700 border-orange-200',
  premium_companion: 'bg-red-50 text-red-700 border-red-200',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', esewa: 'eSewa',
  khalti: 'Khalti', stripe: 'Stripe', cheque: 'Cheque',
}

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Subscription', nurse_visit: 'Nurse Visit',
  doctor_consult: 'Doctor', lab: 'Lab', procedure: 'Procedure', other: 'Other',
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all',     label: 'All Invoices' },
  { value: 'unpaid',  label: 'Unpaid (Sent / Partial / Overdue)' },
  { value: 'paid',    label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'draft',   label: 'Draft' },
]

// ─── Expandable invoice row ───────────────────────────────────────────────────

function PaymentButtons({ inv }: { inv: InvoiceData }) {
  const [loading, setLoading] = useState<'stripe' | 'khalti' | null>(null)
  const outstanding = inv.totalNpr - inv.paidNpr
  if (outstanding <= 0 || inv.status === 'cancelled') return null

  async function handleStripe() {
    setLoading('stripe')
    try {
      const res  = await fetch('/api/billing/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId: inv.id }),
      })
      const text = await res.text()
      const json = text ? JSON.parse(text) : {}
      if (json.url) window.open(json.url, '_blank')
      else alert(json.error ?? `Server error (${res.status})`)
    } catch {
      alert('Could not reach server. Try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleKhalti() {
    setLoading('khalti')
    try {
      const res  = await fetch('/api/billing/khalti/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId: inv.id }),
      })
      const text = await res.text()
      const json = text ? JSON.parse(text) : {}
      if (json.paymentUrl) window.location.href = json.paymentUrl
      else alert(json.error ?? `Server error (${res.status})`)
    } catch {
      alert('Could not reach server. Try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-4 pt-3 border-t border-brand-border space-y-2">
      <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Collect Payment</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleStripe}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === 'stripe'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CreditCard className="w-3.5 h-3.5" />}
          Pay via Card (Stripe)
        </button>
        <button
          onClick={handleKhalti}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === 'khalti'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Smartphone className="w-3.5 h-3.5" />}
          Pay via Khalti
        </button>
      </div>
      <p className="text-[10px] text-brand-muted">
        Card (Stripe) — for overseas family payments &nbsp;·&nbsp; Khalti — for Nepal phone pay
      </p>
    </div>
  )
}

function InvoiceRow({ inv }: { inv: InvoiceData }) {
  const [open, setOpen] = useState(false)
  const cfg         = STATUS_CFG[inv.status] ?? STATUS_CFG.draft
  const Icon        = cfg.icon
  const outstanding = inv.totalNpr - inv.paidNpr

  return (
    <>
      <tr
        className="hover:bg-brand-surface/50 transition-colors cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3 w-6">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
            : <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />}
        </td>
        <td className="px-3 py-3">
          <span className="font-mono text-sm font-medium text-brand-dark">{inv.invoiceNo}</span>
          {inv.planName && (
            <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full border ${KNOWN_PLAN_COLORS[inv.planCode ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {inv.planName}
            </span>
          )}
        </td>
        <td className="px-3 py-3">
          <Link href={`/patients/${inv.patient.id}`}
            onClick={e => e.stopPropagation()}
            className="text-sm text-brand-blue hover:underline">
            {inv.patient.firstName} {inv.patient.lastName}
          </Link>
        </td>
        <td className="px-3 py-3 text-sm text-brand-muted whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
        <td className="px-3 py-3 text-sm text-brand-muted whitespace-nowrap">{formatDate(inv.dueDate)}</td>
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
        </td>
        <td className="px-3 py-3 text-right text-sm font-semibold text-brand-dark whitespace-nowrap">
          {formatMoney(inv.totalNpr)}
        </td>
        <td className="px-3 py-3 text-right text-sm whitespace-nowrap">
          {inv.paidNpr > 0
            ? <span className="text-green-700 font-medium">{formatMoney(inv.paidNpr)}</span>
            : <span className="text-brand-muted">—</span>}
        </td>
        <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
          {outstanding > 0
            ? <span className={`font-semibold ${inv.status === 'overdue' ? 'text-red-600' : 'text-yellow-700'}`}>{formatMoney(outstanding)}</span>
            : <span className="text-green-600 font-medium">Settled</span>}
        </td>
      </tr>

      {open && (
        <tr className="bg-brand-surface/40">
          <td colSpan={9} className="px-6 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-6">
              {/* Line items */}
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Line Items</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-brand-muted border-b border-brand-border">
                      <th className="text-left pb-1 font-medium">Description</th>
                      <th className="text-left pb-1 font-medium">Category</th>
                      <th className="text-center pb-1 font-medium">Qty</th>
                      <th className="text-right pb-1 font-medium">Unit</th>
                      <th className="text-right pb-1 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/30">
                    {inv.lineItems.map(li => (
                      <tr key={li.id}>
                        <td className="py-1.5 pr-3">{li.description}</td>
                        <td className="py-1.5 pr-3 text-xs text-brand-muted">
                          {CATEGORY_LABELS[li.category] ?? li.category}
                        </td>
                        <td className="py-1.5 text-center text-brand-muted">{li.qty}</td>
                        <td className="py-1.5 text-right text-brand-muted">{formatMoney(li.unitPriceNpr)}</td>
                        <td className="py-1.5 text-right font-medium">{formatMoney(li.totalNpr)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-brand-border">
                    <tr>
                      <td colSpan={4} className="pt-1.5 text-right text-xs font-semibold">Total</td>
                      <td className="pt-1.5 text-right font-bold">{formatMoney(inv.totalNpr)}</td>
                    </tr>
                    {inv.paidNpr > 0 && (
                      <tr>
                        <td colSpan={4} className="text-right text-xs text-green-600">Paid</td>
                        <td className="text-right text-xs text-green-600 font-medium">{formatMoney(inv.paidNpr)}</td>
                      </tr>
                    )}
                    {outstanding > 0 && (
                      <tr>
                        <td colSpan={4} className="text-right text-xs font-semibold text-red-600">Outstanding</td>
                        <td className="text-right text-xs font-bold text-red-600">{formatMoney(outstanding)}</td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Payments + actions */}
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Payments Received</p>
                {inv.payments.length === 0 ? (
                  <p className="text-xs text-brand-muted italic">No payments recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {inv.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{formatMoney(p.amountNpr)}</span>
                          <span className="text-xs text-brand-muted ml-2">
                            {METHOD_LABELS[p.method] ?? p.method}
                            {p.payerName ? ` · ${p.payerName}` : ''}
                          </span>
                        </div>
                        <span className="text-xs text-brand-muted">{formatDate(p.paidAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  <Link href={`/billing/invoices/${inv.id}`}
                    className="text-xs text-brand-blue hover:underline font-medium">
                    Open full invoice →
                  </Link>
                </div>
                <PaymentButtons inv={inv} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface Filters {
  dateFrom: string
  dateTo:   string
  status:   string
  search:   string
}

function FilterBar({ filters, onChange }: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [k]: e.target.value })

  const clear = () => onChange({ dateFrom: '', dateTo: '', status: 'all', search: '' })
  const dirty = filters.dateFrom || filters.dateTo || filters.status !== 'all' || filters.search

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs text-brand-muted whitespace-nowrap">From</label>
        <input type="date" value={filters.dateFrom} onChange={set('dateFrom')}
          className="h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-brand-muted whitespace-nowrap">To</label>
        <input type="date" value={filters.dateTo} onChange={set('dateTo')}
          className="h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
      </div>
      <select value={filters.status} onChange={set('status')}
        className="h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30">
        {STATUS_FILTER_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
        <input type="text" placeholder="Patient name or invoice #"
          value={filters.search} onChange={set('search')}
          className="w-full h-8 rounded-lg border border-brand-border pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
      </div>
      {dirty && (
        <button onClick={clear}
          className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-dark">
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillingClient({ stats, invoices }: {
  stats:    Stats
  invoices: InvoiceData[]
}) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '', dateTo: '', status: 'all', search: '',
  })
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (searchParams.get('stripe_success'))    setBanner({ type: 'success', msg: 'Card payment received via Stripe. Invoice updated.' })
    if (searchParams.get('stripe_sub_success')) setBanner({ type: 'success', msg: 'Monthly auto-pay enabled via Stripe. Patient will be billed every month.' })
    if (searchParams.get('khalti_success'))    setBanner({ type: 'success', msg: 'Khalti payment received. Invoice updated.' })
    if (searchParams.get('stripe_cancelled'))  setBanner({ type: 'error',   msg: 'Stripe payment was cancelled.' })
    if (searchParams.get('khalti_error'))      setBanner({ type: 'error',   msg: `Khalti payment failed: ${searchParams.get('khalti_error')}` })
    // Clean up URL params
    if ([...searchParams.keys()].some(k => k.startsWith('stripe') || k.startsWith('khalti')))
      router.replace('/billing')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = inv.invoiceDate.substring(0, 10)
      if (filters.dateFrom && invDate < filters.dateFrom) return false
      if (filters.dateTo   && invDate > filters.dateTo)   return false
      if (filters.status === 'paid'    && inv.status !== 'paid')                               return false
      if (filters.status === 'unpaid'  && !['sent','partial','overdue'].includes(inv.status))  return false
      if (filters.status === 'overdue' && inv.status !== 'overdue')                            return false
      if (filters.status === 'partial' && inv.status !== 'partial')                            return false
      if (filters.status === 'draft'   && inv.status !== 'draft')                              return false
      if (filters.search) {
        const q    = filters.search.toLowerCase()
        const name = `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase()
        if (!inv.invoiceNo.toLowerCase().includes(q) && !name.includes(q)) return false
      }
      return true
    })
  }, [invoices, filters])

  const totals = useMemo(() => ({
    billed:      filtered.reduce((s, i) => s + i.totalNpr, 0),
    collected:   filtered.reduce((s, i) => s + i.paidNpr, 0),
    outstanding: filtered.reduce((s, i) => s + (i.totalNpr - i.paidNpr), 0),
  }), [filtered])

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1>Billing</h1>
        <p className="text-sm text-brand-muted mt-0.5">Invoice ledger and payment tracking</p>
      </div>

      {banner && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
          banner.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {banner.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            {banner.msg}
          </div>
          <button onClick={() => setBanner(null)} className="text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Subscriptions" value={String(stats.activeSubscriptions)} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Revenue This Month"   value={formatMoney(stats.monthlyRevenueNpr)} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Pending Collection"   value={formatMoney(stats.pendingNpr)} icon={<CreditCard className="w-5 h-5" />} />
        <StatCard label="Overdue Invoices"     value={String(stats.overdueInvoices)} icon={<AlertCircle className="w-5 h-5" />} />
      </div>

      {/* Invoice list */}
      <Card padding="none">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-brand-border">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {/* Filtered totals */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-6 px-4 py-2 bg-brand-surface/60 border-b border-brand-border text-xs">
            <span className="text-brand-muted">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-brand-muted">Billed: <span className="font-semibold text-brand-dark">{formatMoney(totals.billed)}</span></span>
            <span className="text-brand-muted">Collected: <span className="font-semibold text-green-700">{formatMoney(totals.collected)}</span></span>
            <span className="text-brand-muted">Outstanding: <span className={`font-semibold ${totals.outstanding > 0 ? 'text-yellow-700' : 'text-brand-muted'}`}>{formatMoney(totals.outstanding)}</span></span>
            <div className="flex-1" />
            <span className="flex items-center gap-1.5 text-brand-muted">
              <Banknote className="w-3.5 h-3.5" /> Cash/eSewa/Khalti — on-site
            </span>
            <span className="flex items-center gap-1.5 text-brand-muted">
              <CreditCard className="w-3.5 h-3.5" /> Stripe/Bank — overseas
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-14 text-brand-muted">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">No invoices match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface border-b border-brand-border">
                <tr className="text-xs text-brand-muted">
                  <th className="px-4 py-2.5 w-6" />
                  <th className="text-left px-3 py-2.5 font-medium">Invoice #</th>
                  <th className="text-left px-3 py-2.5 font-medium">Patient</th>
                  <th className="text-left px-3 py-2.5 font-medium">Date</th>
                  <th className="text-left px-3 py-2.5 font-medium">Due</th>
                  <th className="text-left px-3 py-2.5 font-medium">Status</th>
                  <th className="text-right px-3 py-2.5 font-medium">Total</th>
                  <th className="text-right px-3 py-2.5 font-medium">Paid</th>
                  <th className="text-right px-4 py-2.5 font-medium">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filtered.map(inv => <InvoiceRow key={inv.id} inv={inv} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
