import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-brand-border shadow-sm', PADDING[padding], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between px-5 py-4 border-b border-brand-border', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function StatCard({
  label, value, sub, icon, trend,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'flat'
}) {
  return (
    <Card className="flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0 text-brand-red">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-brand-muted">{label}</p>
        <p className="text-2xl font-semibold text-brand-dark mt-0.5">{value}</p>
        {sub && <p className="text-xs text-brand-muted mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}
