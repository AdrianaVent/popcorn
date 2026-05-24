'use client'

import PageSkeleton from '@/components/ui/PageSkeleton'
import ExportButton from '@/components/common/ExportButton'
import { staticSeriesFiltersSchema } from '@/features/series/seriesFilters.schema'
import type { FilterField } from '@/types/table'

export default function Loading() {
  return (
    <PageSkeleton
      titleKey="series.title"
      headerEnd={<ExportButton disabled />}
      hasImage
      cols={7}
      filterTitleKey="series.filters.panel"
      filterSchema={staticSeriesFiltersSchema as FilterField<Record<string, unknown>>[]}
    />
  )
}
