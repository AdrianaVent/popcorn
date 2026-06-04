import { Column } from '@/types/table'
import { widthMap } from './Table'
import clsx from 'clsx'

const SKELETON_WIDTHS = ['w-1/4', 'w-1/3', 'w-1/5', 'w-1/2', 'w-2/5']

type TableBodyProps<T extends Record<string, unknown>> = {
  data: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  loading?: boolean
  skeletonRows?: number
}

export default function TableBody<
  T extends Record<string, unknown>
>({
  data,
  columns,
  getRowKey,
  onRowClick,
  rowClassName,
  loading = false,
  skeletonRows = 9,
}: TableBodyProps<T>) {
  if (loading) {
    return (
      <tbody>
        {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
          <tr
            key={rowIndex}
            className={clsx(
              'border-b border-border',
              rowIndex % 2 === 0 ? 'bg-cream-100 dark:bg-gray-900 hc:bg-background' : 'bg-cream-300 dark:bg-gray-800 hc:bg-background'
            )}
          >
            {columns.map((col, colIndex) => (
              <td
                key={String(col.key)}
                className={clsx('px-2 py-2 align-middle overflow-hidden', col.width && widthMap[col.width])}
              >
                {col.width === 'xs'
                  ? <div className="w-10 h-10 rounded-md bg-border animate-pulse mx-auto" />
                  : <div className={`h-3 rounded bg-border animate-pulse ${SKELETON_WIDTHS[(rowIndex + colIndex) % SKELETON_WIDTHS.length]}`} />
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  return (
    <tbody>
      {data.map((row, index) => (
        <tr
          key={getRowKey(row)}
          onClick={() => onRowClick?.(row)}
          className={clsx(
            'border-b border-border transition-colors',
            index % 2 === 0
              ? 'bg-cream-100 dark:bg-gray-900 hc:bg-background'
              : 'bg-cream-300 dark:bg-gray-800 hc:bg-background',
            'hover:bg-cream-400 dark:hover:bg-gray-700/60 hc:hover:bg-muted',
            onRowClick && 'cursor-pointer',
            rowClassName?.(row)
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
