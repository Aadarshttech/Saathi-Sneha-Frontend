import { NextRequest, NextResponse } from 'next/server'
import { initiateKhaltiPayment } from '@/lib/khalti'
import { getPortalSession } from '@/lib/portal-auth'
import prisma from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, source } = body as { invoiceId?: string; source?: string }

    if (!invoiceId || !UUID_RE.test(invoiceId)) {
      return NextResponse.json({ error: 'Valid invoiceId is required' }, { status: 400 })
    }

    // When called from the patient portal, enforce ownership
    const portalSession = getPortalSession()
    const invoice = await prisma.invoice.findUnique({
      where:   { id: invoiceId },
      include: { patient: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    if (portalSession && invoice.patientId !== portalSession.patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const outstanding = invoice.totalNpr - invoice.paidNpr
    if (outstanding <= 0) return NextResponse.json({ error: 'Invoice already fully paid' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Pass source through so the verify callback knows where to redirect after payment
    const verifyParams = new URLSearchParams({ invoiceId })
    if (source === 'portal') verifyParams.set('source', 'portal')

    const result = await initiateKhaltiPayment({
      amountNpr:     outstanding,
      orderId:       invoice.id,
      orderName:     `Invoice ${invoice.invoiceNo}`,
      returnUrl:     `${appUrl}/api/billing/khalti/verify?${verifyParams.toString()}`,
      customerName:  `${invoice.patient.firstName} ${invoice.patient.lastName}`,
      customerPhone: invoice.patient.phone ?? undefined,
    })

    return NextResponse.json({ paymentUrl: result.payment_url, pidx: result.pidx })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('Khalti initiate error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
