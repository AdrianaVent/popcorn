import type { Column, SortState } from '@/types/table'
import { widthMap } from './Table'
import clsx from 'clsx'

type TableHeadProps<T extends Record<string, unknown>> = {
  columns: Column<T>[]
  sort?: SortState<T> | null
  onSort?: (key: keyof T) => void
}

function SortIcon<T extends Record<string, unknown>>({ col, sort }: { col: Column<T>; sort?: SortState<T> | null }) {
  const active = sort?.key === col.key
  const asc    = active && sort?.dir === 'asc'
  const desc   = active && sort?.dir === 'desc'

  return (
    <span className="inline-flex flex-col ml-1 shrink-0" aria-hidden>
      <svg width="8" height="5" viewBox="0 0 8 5" className={clsx('block', asc ? 'text-primary' : 'text-muted-foreground/40')}>
        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={clsx('block mt-0.5', desc ? 'text-primary' : 'text-muted-foreground/40')}>
        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
      </svg>
    </span>
  )
}

export default function TableHead<T extends Record<string, unknown>>({
  columns,
  sort,
  onSort,
}: TableHeadProps<T>) {
  return (
    <thead>
      <tr>
        {columns.map((col) => {
          const isActive = sort?.key === col.key
          const content = col.headerNode ?? (
            <span className="inline-flex items-center gap-0">
              {col.header}
              {col.sortable && <SortIcon col={col} sort={sort} />}
            </span>
          )

          return (
            <th
              key={String(col.key)}
              className={clsx(
                'sticky top-0 z-10 bg-background',
                'border-b border-border/60 shadow-[0_1px_0_rgba(0,0,0,0.04)]',
                'px-2 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] overflow-hidden',
                isActive ? 'text-primary' : 'text-foreground',
                col.sortable && 'cursor-pointer select-none hover:text-primary transition-colors',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                col.width && widthMap[col.width],
                col.className
              )}
              onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
            >
              {content}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
