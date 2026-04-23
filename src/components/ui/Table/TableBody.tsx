import { Column } from '@/types/table'
import { widthMap } from './Table'
import clsx from 'clsx'

type TableBodyProps<T extends Record<string, unknown>> = {
  data: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
}

export default function TableBody<
  T extends Record<string, unknown>
>({
  data,
  columns,
  getRowKey,
  onRowClick,
}: TableBodyProps<T>) {
  return (
    <tbody>
      {data.map((row, index) => (
        <tr
          key={getRowKey(row)}
          onClick={() => onRowClick?.(row)}
          className={clsx(
            `
            border-b border-border
            transition-colors
            `,
            // ─── ZEBRA ───
            index % 2 === 0
              ? 'bg-cream-100 dark:bg-gray-900'
              : 'bg-cream-300 dark:bg-gray-800',

            // ─── HOVER ───
            'hover:bg-cream-400 dark:hover:bg-gray-700/60',

            onRowClick && 'cursor-pointer'
          )}
        >
          {columns.map((col) => (
            <td
              key={String(col.key)}
              className={clsx(
                `
                px-2 py-2
                text-sm
                text-foreground
                align-middle
                overflow-hidden
                `,
                col.align === 'center' && 'text-center',
                col.align === 'right' && 'text-right',
                col.align !== 'center' && col.align !== 'right' && 'text-left',

                col.width && widthMap[col.width],
                col.className
              )}
            >
              {col.render
                ? col.render(row)
                : String(row[col.key] ?? '—')}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}