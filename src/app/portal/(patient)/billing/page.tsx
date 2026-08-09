'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CreditCard, Smartphone, CheckCircle2, AlertTriangle, Loader2, Receipt } from 'lucide-react'

interface Invoice {
  id:          string
  invoiceNo:   string
  invoiceDate: string
  dueDate:     string
  status:      string
  totalNpr:    number
  paidNpr:     number
  planName:    string | null
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600'    },
  sent:      { label: 'Due',       color: 'bg-blue-100 text-blue-700'    },
  paid:      { label: 'Paid',      color: 'bg-green-100 text-green-700'  },
  partial:   { label: 'Partial',   color: 'bg-yellow-100 text-yellow-700' },
  overdue:   { label: 'Overdue',   color: 'bg-red-100 text-red-700'      },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500'    },
}

export default function PatientBillingPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [invoices, setInvoices]   = useState<Invoice[]>([])
  const [loading, setLoading]     = useState(true)
  const [paying, setPaying]       = useState<{ id: string; method: 'stripe' | 'khalti' } | null>(null)
  const [banner, setBanner]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (searchParams.get('stripe_success')) setBanner({ type: 'success', msg: 'Card payment received. Thank you!' })
    if (searchParams.get('khalti_success')) setBanner({ type: 'success', msg: 'Khalti payment received. Thank you!' })
    if (searchParams.get('stripe_cancelled')) setBanner({ type: 'error', msg: 'Payment was cancelled.' })
    if (searchParams.get('khalti_error'))     setBanner({ type: 'error', msg: 'Khalti payment failed. Please try again.' })
    if ([...searchParams.keys()].some(k => k.startsWith('stripe') || k.startsWith('khalti')))
      router.replace('/portal/billing')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/portal/billing/invoices')
      .then(async r => {
        if (!r.ok) { setBanner({ type: 'error', msg: 'Failed to load invoices. Please refresh.' }); return }
        const j = await r.json()
        setInvoices(j.invoices ?? [])
      })
      .catch(() => setBanner({ type: 'error', msg: 'Network error. Please check your connection.' }))
      .finally(() => setLoading(false))
  }, [])

  async function payStripe(invoiceId: string) {
    setPaying({ id: invoiceId, method: 'stripe' })
    try {
      const res  = await fetch('/api/billing/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId, source: 'portal' }),
      })
      const text = await res.text()
      const json = text ? JSON.parse(text) : {}
      if (json.url) window.location.href = json.url
      else setBanner({ type: 'error', msg: json.error ?? `Server error (${res.status})` })
    } catch {
      setBanner({ type: 'error', msg: 'Could not reach server. Try again.' })
    } finally {
      setPaying(null)
    }
  }

  async function payKhalti(invoiceId: string) {
    setPaying({ id: invoiceId, method: 'khalti' })
    try {
      const res  = await fetch('/api/billing/khalti/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId, source: 'portal' }),
      })
      const text = await res.text()
      const json = text ? JSON.parse(text) : {}
      if (json.paymentUrl) window.location.href = json.paymentUrl
      else setBanner({ type: 'error', msg: json.error ?? `Server error (${res.status})` })
    } catch {
      setBanner({ type: 'error', msg: 'Could not reach server. Try again.' })
    } finally {
      setPaying(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand-red" /> My Invoices
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">View and pay your outstanding bills</p>
      </div>

      {banner && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${
          banner.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="flex items-center gap-2">
            {banner.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            {banner.msg}
          </span>
          <button onClick={() => setBanner(null)} className="text-xs underline opacity-70">Dismiss</button>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No invoices found</p>
          <p className="text-sm mt-1">Your billing history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const outstanding = inv.totalNpr - inv.paidNpr
            const cfg         = STATUS_CFG[inv.status] ?? STATUS_CFG.draft
            const unpaid      = outstanding > 0 && inv.status !== 'cancelled' && inv.status !== 'draft'

            return (
              <div key={inv.id} className={`bg-white rounded-xl border p-4 space-y-3 ${
                inv.status === 'overdue' ? 'border-red-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-gray-900">{inv.invoiceNo}</p>
                    {inv.planName && <p className="text-xs text-gray-500">{inv.planName}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Issued {format(new Date(inv.invoiceDate), 'MMM d, yyyy')} · Due {format(new Date(inv.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="font-bold text-gray-900">रू {inv.totalNpr.toLocaleString()}</p>
                  </div>
                  {inv.paidNpr > 0 && (
                    <div className="text-right space-y-0.5">
                      <p className="text-gray-500 text-xs">Paid</p>
                      <p className="font-medium text-green-700">रू {inv.paidNpr.toLocaleString()}</p>
                    </div>
                  )}
                  {outstanding > 0 && (
                    <div className="text-right space-y-0.5">
                      <p className="text-gray-500 text-xs">Outstanding</p>
                      <p className={`font-bold ${inv.status === 'overdue' ? 'text-red-600' : 'text-yellow-700'}`}>
                        रू {outstanding.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {inv.status === 'paid' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {unpaid && (
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => payKhalti(inv.id)}
                      disabled={paying !== null}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex-1 justify-center"
                    >
                      {paying?.id === inv.id && paying.method === 'khalti'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Smartphone className="w-3.5 h-3.5" />}
                      Pay with Khalti
                    </button>
                    <button
                      onClick={() => payStripe(inv.id)}
                      disabled={paying !== null}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex-1 justify-center"
                    >
                      {paying?.id === inv.id && paying.method === 'stripe'
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CreditCard className="w-3.5 h-3.5" />}
                      Pay with Card
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
