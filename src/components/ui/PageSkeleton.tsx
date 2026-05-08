'use client'

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import TableSkeleton from '@/components/ui/Table/TableSkeleton'
import Header from '@/components/ui/Header'
import FiltersPanel from '@/components/common/FiltersPanel'
import type { FilterField } from '@/types/table'

type Props = {
  titleKey: string
  headerEnd?: ReactNode
  hasImage?: boolean
  cols?: number
  filterTitleKey?: string
  filterSchema?: FilterField<Record<string, unknown>>[]
}

export default function PageSkeleton({
  titleKey,
  headerEnd,
  hasImage = true,
  cols = 5,
  filterTitleKey,
  filterSchema,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Header title={t(titleKey)} end={headerEnd} />

      {filterSchema ? (
        <FiltersPanel
          schema={filterSchema}
          filters={{}}
          onChange={() => {}}
          titleKey={filterTitleKey}
          disabled
        />
      ) : (
        <div className="rounded-lg border border-border bg-card/60 h-14 animate-pulse" />
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <TableSkeleton hasImage={hasImage} cols={cols} />
      </div>
    </div>
  )
}
