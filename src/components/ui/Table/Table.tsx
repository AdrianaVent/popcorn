'use client'

import TableHead from './TableHead'
import TableBody from './TableBody'
import TableFooter from './TableFooter'
import type { Column } from '@/types/table'

type TableProps<T extends Record<string, unknown>> = {
  data: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string | number
  footer?: React.ComponentProps<typeof TableFooter>
  onRowClick?: (row: T) => void
}

export const widthMap = {
  xs: 'w-16',
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-48',
  flex: 'w-full',
} as const

export default function Table<T extends Record<string, unknown>>({
  data,
  columns,
  getRowKey,
  footer,
  onRowClick,
}: TableProps<T>) {
  return (
    <div
      className="
        relative
        flex flex-col
        h-full
        border border-border
        rounded-lg
        overflow-hidden
      "
    >
      <div className="flex-1 min-h-0 overflow-auto pb-14">
       <table className="w-full table-fixed text-sm">
          <TableHead columns={columns} />
          <TableBody
            data={data}
            columns={columns}
            getRowKey={getRowKey}
            onRowClick={onRowClick}
          />
        </table>
      </div>
      {footer && (
        <div
          className="
            absolute
            bottom-0 left-0 right-0
            border-t border-border
            bg-card
            shadow-[0_-2px_10px_rgba(0,0,0,0.06)]
            px-3 py-2
          "
        >
          <TableFooter {...footer} />
        </div>
      )}
    </div>
  )
}