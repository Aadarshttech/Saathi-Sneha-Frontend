import { NextRequest, NextResponse } from 'next/server'
import { stripe, fromStripeAmount } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import type Stripe from 'stripe'

// Required: Next.js App Router — disable body parsing so Stripe can verify the raw signature
export const runtime = 'nodejs'

async function recordPayment(invoiceId: string, amountNpr: number, referenceNo: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice) return

  await prisma.payment.create({
    data: {
      invoiceId,
      amountNpr,
      method:      'stripe',
      payerType:   invoice.payerType,
      referenceNo,
    },
  })

  const newPaid = invoice.paidNpr + amountNpr
  await prisma.invoice.update({
    where: { id: invoiceId },
    data:  { paidNpr: newPaid, status: newPaid >= invoice.totalNpr ? 'paid' : 'partial' },
  })
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // One-time payment OR subscription setup completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'payment') {
          // One-time invoice payment
          const invoiceId  = session.metadata?.invoiceId
          const amountPaisa = session.amount_total ?? 0
          const paymentRef  = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? ''

          if (invoiceId && amountPaisa > 0 && paymentRef) {
            await recordPayment(invoiceId, fromStripeAmount(amountPaisa), paymentRef)
          }
        } else if (session.mode === 'subscription') {
          // Monthly auto-pay setup — link stripeSubscriptionId to our subscription record
          const subscriptionId       = session.metadata?.subscriptionId
          const stripeSubscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id

          if (subscriptionId && stripeSubscriptionId) {
            await prisma.patientSubscription.update({
              where: { id: subscriptionId },
              data:  { stripeSubscriptionId, autoRenew: true },
            })
          }
        }
        break
      }

      // Monthly subscription payment succeeded
      case 'invoice.paid': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv          = event.data.object as any
        const stripeSubId: string | undefined =
          typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id

        if (!stripeSubId) break

        const sub = await prisma.patientSubscription.findFirst({
          where:   { stripeSubscriptionId: stripeSubId },
          include: { invoices: { where: { status: { not: 'paid' } }, orderBy: { invoiceDate: 'desc' }, take: 1 } },
        })
        if (!sub) break

        const amountNpr   = fromStripeAmount(inv.amount_paid as number)
        const referenceNo = typeof inv.payment_intent === 'string'
          ? inv.payment_intent
          : (inv.payment_intent?.id as string | undefined) ?? ''

        const latestInvoice = sub.invoices[0]
        if (latestInvoice && amountNpr > 0 && referenceNo) {
          await recordPayment(latestInvoice.id, amountNpr, referenceNo)
        }

        await prisma.patientSubscription.update({
          where: { id: sub.id },
          data:  { autoRenew: true, status: 'active' },
        })
        break
      }

      // Subscription cancelled or payment failed — pause auto-renew
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = event.data.object
        const stripeSubId: string | undefined = 'plan' in obj
          ? (obj.id as string)               // Subscription object has 'plan'
          : typeof obj.subscription === 'string'
            ? obj.subscription
            : obj.subscription?.id

        if (stripeSubId) {
          await prisma.patientSubscription.updateMany({
            where: { stripeSubscriptionId: stripeSubId },
            data:  { autoRenew: false, status: 'paused' },
          })
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`Error processing Stripe webhook event ${event.type}:`, err)
    // Return 200 anyway — Stripe retries on non-2xx, which would flood logs for logic errors
    return NextResponse.json({ received: true, error: 'Internal processing error' })
  }

  return NextResponse.json({ received: true })
}
