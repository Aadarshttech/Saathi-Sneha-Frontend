const KHALTI_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://khalti.com/api/v2'
    : 'https://dev.khalti.com/api/v2'

function getAuthHeader(): string {
  const key = process.env.KHALTI_SECRET_KEY
  if (!key) throw new Error('KHALTI_SECRET_KEY environment variable is not set')
  return `Key ${key}`
}

export interface KhaltiInitiateResult {
  pidx:        string
  payment_url: string
  expires_at:  string
}

export interface KhaltiLookupResult {
  pidx:                string
  total_amount:        number  // in paisa
  status:              string  // Completed | Pending | Initiated | Refunded | Expired | User canceled | Failed
  transaction_id:      string
  purchase_order_id:   string
  purchase_order_name: string
}

export async function initiateKhaltiPayment(opts: {
  amountNpr:     number
  orderId:       string
  orderName:     string
  returnUrl:     string
  customerName?: string
  customerPhone?: string
}): Promise<KhaltiInitiateResult> {
  if (opts.amountNpr <= 0) throw new Error('Payment amount must be greater than zero')

  const res = await fetch(`${KHALTI_BASE}/epayment/initiate/`, {
    method:  'POST',
    headers: {
      Authorization:  getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      return_url:          opts.returnUrl,
      website_url:         process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      amount:              opts.amountNpr * 100,
      purchase_order_id:   opts.orderId,
      purchase_order_name: opts.orderName,
      ...(opts.customerName && {
        customer_info: {
          name:  opts.customerName.slice(0, 100),
          phone: (opts.customerPhone ?? '').slice(0, 20),
        },
      }),
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Khalti initiate failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<KhaltiInitiateResult>
}

export async function verifyKhaltiPayment(pidx: string): Promise<KhaltiLookupResult> {
  if (!pidx || !pidx.trim()) throw new Error('Invalid pidx')

  const res = await fetch(`${KHALTI_BASE}/epayment/lookup/`, {
    method:  'POST',
    headers: {
      Authorization:  getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pidx }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Khalti lookup failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<KhaltiLookupResult>
}
