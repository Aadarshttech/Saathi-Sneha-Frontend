import { NextRequest, NextResponse } from 'next/server'
import { verifyKhaltiPayment } from '@/lib/khalti'
import prisma from '@/lib/prisma'

// Khalti redirects here after the user completes payment in their app.
// Query params: ?pidx=<khalti_payment_id>&invoiceId=<our_invoice_uuid>&source=portal?
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pidx        = searchParams.get('pidx')
  const invoiceId   = searchParams.get('invoiceId')
  const source      = searchParams.get('source')
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const billingPath = source === 'portal' ? '/portal/billing' : '/billing'

  function redirect(params: Record<string, string>) {
    return NextResponse.redirect(`${appUrl}${billingPath}?${new URLSearchParams(params).toString()}`)
  }

  if (!pidx || !invoiceId) {
    return redirect({ khalti_error: 'missing_params' })
  }

  try {
    const result = await verifyKhaltiPayment(pidx)

    if (result.status !== 'Completed') {
      return redirect({ khalti_error: 'not_completed', status: result.status })
    }

    const amountNpr = Math.round(result.total_amount / 100)
    if (amountNpr <= 0) {
      return redirect({ khalti_error: 'invalid_amount' })
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) return redirect({ khalti_error: 'invoice_not_found' })

    await prisma.payment.create({
      data: {
        invoiceId,
        amountNpr,
        method:      'khalti',
        payerType:   invoice.payerType,
        referenceNo: result.transaction_id,
        notes:       `Khalti pidx: ${pidx}`,
      },
    })

    const newPaid = invoice.paidNpr + amountNpr
    await prisma.invoice.update({
      where: { id: invoiceId },
      data:  { paidNpr: newPaid, status: newPaid >= invoice.totalNpr ? 'paid' : 'partial' },
    })

    return redirect({ khalti_success: '1', invoice: invoiceId })
  } catch (err) {
    console.error('Khalti verify error:', err)
    return redirect({ khalti_error: 'verify_failed' })
  }
}
