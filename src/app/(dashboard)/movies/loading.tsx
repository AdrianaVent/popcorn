'use client'

import PageSkeleton from '@/components/ui/PageSkeleton'
import ExportButton from '@/components/common/ExportButton'
import { staticMovieFiltersSchema } from '@/features/movies/movieFilters.schema'
import { useDashboardRole } from '@/app/(dashboard)/DashboardRoleContext'
import type { FilterField } from '@/types/table'

export default function Loading() {
  const role = useDashboardRole()
  const isAdmin = role === 'admin'

  return (
    <PageSkeleton
      titleKey="movies.title"
      headerEnd={<ExportButton disabled />}
      hasImage
      cols={isAdmin ? 5 : 6}
      filterTitleKey="movies.filters.panel"
      filterSchema={staticMovieFiltersSchema as FilterField<Record<string, unknown>>[]}
    />
  )
}
