'use client'

import TableHead from './TableHead'
import TableBody from './TableBody'
import TableFooter from './TableFooter'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import type { Column } from '@/types/table'

type TableProps<T extends Record<string, unknown>> = {
  data: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string | number
  footer?: React.ComponentProps<typeof TableFooter>
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  error?: string | null
  onRetry?: () => void
  emptyMessage?: string
  scrollKey?: string | number
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
  rowClassName,
  loading = false,
  skeletonRows,
  error,
  onRetry,
  emptyMessage,
  scrollKey,
}: TableProps<T>) {
  const { t } = useTranslation()
  const showOverlay = !loading && (error || (!error && data.length === 0 && emptyMessage))

  return (
    <div className="relative flex flex-col h-full border border-border rounded-lg overflow-hidden">
      <div key={scrollKey} className="flex-1 min-h-0 overflow-auto pb-14">
        <table className="w-full table-fixed text-sm">
          <TableHead columns={columns} />
          <TableBody
            data={data}
            columns={columns}
            getRowKey={getRowKey}
            onRowClick={onRowClick}
            rowClassName={rowClassName}
            loading={loading}
            skeletonRows={skeletonRows}
          />
        </table>
      </div>

      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-lg">
          {error ? (
            <div className="flex flex-col items-center gap-3">
              <Text variant="body" className="text-muted-foreground">{error}</Text>
              {onRetry && <Button variant="secondary" onClick={onRetry}>{t('common.retry')}</Button>}
            </div>
          ) : (
            <Text variant="body" className="text-muted-foreground">{emptyMessage}</Text>
          )}
        </div>
      )}

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
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="h-5 w-16 rounded bg-border animate-pulse" />
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-7 w-7 rounded-md bg-border animate-pulse" />
                ))}
              </div>
              <div className="h-5 w-16 rounded bg-border animate-pulse" />
            </div>
          ) : (
            <TableFooter {...footer} />
          )}
        </div>
      )}
    </div>
  )
}
