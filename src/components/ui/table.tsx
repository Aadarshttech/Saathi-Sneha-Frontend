import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  className?: string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (row: T) => void
  emptyText?: string
  loading?: boolean
}

export function Table<T>({ columns, data, keyField, onRowClick, emptyText = 'No records found.', loading }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-border bg-brand-surface/60">
            {columns.map(col => (
              <th key={col.key} className={cn('px-4 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-brand-muted text-xs">
                Loading…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-brand-muted text-xs">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row[keyField])}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-brand-border/50 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-brand-surface/60 transition-colors',
                  i % 2 === 1 && 'bg-brand-surface/20',
                )}
              >
                {columns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
