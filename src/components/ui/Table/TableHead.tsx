import type { Column } from '@/types/table'
import { widthMap } from './Table'
import clsx from 'clsx'

type TableHeadProps<T extends Record<string, unknown>> = {
  columns: Column<T>[]
}

export default function TableHead<
  T extends Record<string, unknown>
>({ columns }: TableHeadProps<T>) {
  return (
    <thead className="sticky top-0 z-10 bg-background will-change-transform">
      <tr className="
        bg-background
        border-y border-border/60
        shadow-[0_1px_0_rgba(0,0,0,0.04)]
      ">
        {columns.map((col) => (
          <th
            key={String(col.key)}
            className={clsx(
              `
              text-left
              px-2 py-4
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-foreground
              `,
              col.align === 'center' && 'text-center',
              col.align === 'right' && 'text-right',
              col.width && widthMap[col.width],
              col.className
            )}
          >
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
  )
}