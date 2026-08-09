import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function formatRelative(date: Date | string | null): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function calculateAge(dob: Date | string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function fullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`
}

// Stored amounts are USD (columns are still named *Npr in the schema, but hold USD
// values as of the NPR->USD conversion — see the one-time migration note in git history).
export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

// Derives a clear payment status from a PatientSubscription's existing state — no new
// data needed, the Stripe webhook (api/billing/stripe/webhook) already sets stripeSubscriptionId
// on checkout.session.completed and flips status to 'paused' on invoice.payment_failed /
// customer.subscription.deleted.
export function paymentStatus(sub: { status: string; stripeSubscriptionId: string | null } | null | undefined): {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'muted'
} {
  if (!sub) return { label: 'No Plan', variant: 'muted' }
  if (!sub.stripeSubscriptionId) return { label: 'Payment Pending', variant: 'warning' }
  if (sub.status === 'paused') return { label: 'Payment Failed', variant: 'danger' }
  if (sub.status === 'active') return { label: 'Payment Processed', variant: 'success' }
  if (sub.status === 'trial') return { label: 'Trial', variant: 'warning' }
  if (sub.status === 'cancelled') return { label: 'Cancelled', variant: 'muted' }
  return { label: sub.status, variant: 'muted' }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
