'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'

const METHODS = [
  { value: 'stripe',        label: 'Stripe (Card)',   payer: 'family_overseas' },
  { value: 'bank_transfer', label: 'Bank Transfer',   payer: 'family_overseas' },
  { value: 'esewa',         label: 'eSewa',           payer: 'patient_local' },
  { value: 'khalti',        label: 'Khalti',          payer: 'patient_local' },
  { value: 'cash',          label: 'Cash',            payer: 'patient_local' },
  { value: 'cheque',        label: 'Cheque',          payer: 'patient_local' },
]

export default function InvoiceActionClient({
  invoiceId, outstanding, defaultPayerType,
}: {
  invoiceId: string
  outstanding: number
  defaultPayerType: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [form, setForm] = useState({
    amountNpr:   String(outstanding),
    method:      defaultPayerType === 'family_overseas' ? 'stripe' : 'cash',
    payerType:   defaultPayerType,
    payerName:   '',
    referenceNo: '',
    notes:       '',
  })

  const handleMethodChange = (method: string) => {
    const m = METHODS.find(m => m.value === method)
    setForm(p => ({ ...p, method, payerType: m?.payer ?? p.payerType }))
  }

  const save = async () => {
    const amt = parseInt(form.amountNpr, 10)
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountNpr:   amt,
        method:      form.method,
        payerType:   form.payerType,
        payerName:   form.payerName  || undefined,
        referenceNo: form.referenceNo || undefined,
        notes:       form.notes      || undefined,
      }),
    })
    if (!res.ok) {
      const j = await res.json()
      setError(JSON.stringify(j.error))
    } else {
      router.refresh()
    }
    setSaving(false)
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-sm">
        <CreditCard className="w-4 h-4 text-brand-muted" /> Record Payment
      </h3>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="space-y-3">
        <div>
          <label className="text-xs text-brand-muted block mb-1">Amount (USD)</label>
          <input
            type="number" min={1} value={form.amountNpr} onChange={f('amountNpr')}
            className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30"
          />
          <p className="text-xs text-brand-muted mt-0.5">Outstanding: {formatMoney(outstanding)}</p>
        </div>

        <div>
          <label className="text-xs text-brand-muted block mb-1">Payment Method</label>
          <select value={form.method} onChange={e => handleMethodChange(e.target.value)}
            className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30">
            <optgroup label="Overseas Family">
              <option value="stripe">Stripe (Card)</option>
              <option value="bank_transfer">Bank Transfer</option>
            </optgroup>
            <optgroup label="On-site / Local">
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="text-xs text-brand-muted block mb-1">Payer Type</label>
          <select value={form.payerType} onChange={f('payerType')}
            className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30">
            <option value="family_overseas">Overseas Family</option>
            <option value="patient_local">Patient / Local Family</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-brand-muted block mb-1">Payer Name</label>
          <input value={form.payerName} onChange={f('payerName')} placeholder="Who paid?"
            className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
        </div>

        <div>
          <label className="text-xs text-brand-muted block mb-1">Reference / Transaction #</label>
          <input value={form.referenceNo} onChange={f('referenceNo')} placeholder="e.g. eSewa TXN #"
            className="w-full h-8 rounded-lg border border-brand-border px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
        </div>

        <div>
          <label className="text-xs text-brand-muted block mb-1">Notes</label>
          <textarea value={form.notes} onChange={f('notes')} rows={2}
            className="w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red/30" />
        </div>

        <Button className="w-full" loading={saving} onClick={save}>
          Record Payment
        </Button>
      </div>
    </Card>
  )
}
