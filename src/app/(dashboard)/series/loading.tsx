'use client'

import PageSkeleton from '@/components/ui/PageSkeleton'
import ExportButton from '@/components/common/ExportButton'
import { staticSeriesFiltersSchema } from '@/features/series/seriesFilters.schema'
import { useDashboardRole } from '@/app/(dashboard)/DashboardRoleContext'
import type { FilterField } from '@/types/table'

export default function Loading() {
  const role = useDashboardRole()
  const isAdmin = role === 'admin'

  return (
    <PageSkeleton
      titleKey="series.title"
      headerEnd={<ExportButton disabled />}
      hasImage
      cols={isAdmin ? 6 : 7}
      filterTitleKey="series.filters.panel"
      filterSchema={staticSeriesFiltersSchema as FilterField<Record<string, unknown>>[]}
    />
  )
}
