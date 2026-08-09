import { cn } from '@/lib/utils'
import { VISIT_STATUS_COLORS, VISIT_STATUS_LABELS } from '@/lib/constants'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  className?: string
}

const BADGE_VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-800',
  muted:   'bg-brand-surface text-brand-muted',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', BADGE_VARIANTS[variant], className)}>
      {children}
    </span>
  )
}

export function VisitStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', VISIT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600')}>
      {VISIT_STATUS_LABELS[status] ?? status}
    </span>
  )
}
