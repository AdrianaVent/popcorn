'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import Table from '@/components/ui/Table/Table'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import SeriesDetailModal from './components/SeriesDetailModal'
import PageLayout from '@/components/layouts/PageLayout'
import { TvIcon } from '@/components/icons'

import { useSeries, applyClientFilters } from './hooks/useSeries'
import { fetchSeries, fetchSeriesWatchProviderOptions } from './series.service'
import { useSeriesEnrichment } from './hooks/useSeriesEnrichment'
import { useSeriesColumns } from './hooks/useSeriesColumns'
import { useSeriesExport } from './hooks/useSeriesExport'
import { applyRuntimeFilter } from './hooks/applyRuntimeFilter'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useFilters } from '@/hooks/useFilters'
import { useFilterSchema } from '@/hooks/useFilterSchema'
import { useQuery } from '@tanstack/react-query'
import { staticSeriesFiltersSchema } from './seriesFilters.schema'
import { resolveGenreName, SERIES_GENRE_IDS } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import type { SortState } from '@/types/table'
import type { SeriesRow, SeriesFilters } from '@/types/series'
import type { WatchProvider } from '@/types/tmdb'

// Name is sorted client-side: TMDB places non-Latin names first in desc order
// (high Unicode code points), so server-side name sort produces empty pages after filtering.
const SERIES_SORT_FIELD: Partial<Record<keyof SeriesRow, string>> = {
  first_air_date: 'first_air_date',
  vote_average:   'vote_average',
  vote_count:     'vote_count',
}

const NAME_SORT_PAGE_CAP = 10
const initialFilters: SeriesFilters = {}

export default function SeriesFeature() {
  const { t } = useTranslation()
  const { language } = useLanguageStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { filters, setFilters } = useFilters<SeriesFilters>(initialFilters)
  const [sort, setSort] = useState<SortState<SeriesRow> | null>(null)

  const inSearchMode = Boolean(filters.title)
  const sortBy = sort && !inSearchMode ? `${SERIES_SORT_FIELD[sort.key]}.${sort.dir}` : undefined

  const { series, loading, error, page, totalPages, retry, goToPage } = useSeries(filters, sortBy)

  const handleSort = useCallback((key: keyof SeriesRow) => {
    setSort((prev) => prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    goToPage(1)
  }, [goToPage])

  const role    = useUserStore((s) => s.role)
  const userId  = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')
  const seriesEpisodes    = useWatchedStore((s) => s.episodes[userKey])
  const watchedSeriesData = useWatchedStore((s) => s.seriesData[userKey])

  const { data: providerOptions } = useQuery<WatchProvider[]>({ queryKey: ['series-provider-options'], queryFn: fetchSeriesWatchProviderOptions, staleTime: Infinity })

  const genreOptions = useMemo(
    () => SERIES_GENRE_IDS.map((id) => ({ value: id, label: resolveGenreName(id, language), icon: getGenreIcon(id) ?? undefined })),
    [language],
  )

  const filtersSchema = useFilterSchema(staticSeriesFiltersSchema, { role, providerOptions, genreOptions })

  const isNameSort = sort?.key === 'name' && !inSearchMode && filters.watched !== 'watched'

  const { data: nameSortData, isLoading: nameSortLoading } = useQuery<SeriesRow[]>({
    queryKey: ['series-name-sort', language, filters],
    queryFn: async () => {
      const first = await fetchSeries(1, language, filters)
      const maxPage = Math.min(first.total_pages ?? 1, NAME_SORT_PAGE_CAP)
      const rest = await Promise.all(Array.from({ length: maxPage - 1 }, (_, i) => fetchSeries(i + 2, language, filters)))
      const all = [first, ...rest].flatMap((r) => applyClientFilters(r.results ?? [], filters))
      const seen = new Set<number>()
      return all.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true })
    },
    enabled: isNameSort,
    staleTime: 5 * 60 * 1000,
  })

  const visibleSeries = useMemo(() => {
    if (isNameSort) {
      const sorted = [...(nameSortData ?? [])].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name)
        return sort!.dir === 'asc' ? cmp : -cmp
      })
      return sorted.slice((page - 1) * 20, page * 20)
    }
    return series
  }, [isNameSort, nameSortData, page, sort, series])

  const { statuses, totals, runtimes, genreIds } = useSeriesEnrichment(visibleSeries, language)

  const watchedModeItems = useMemo((): SeriesRow[] => {
    if (filters.watched !== 'watched') return []
    return Object.values(watchedSeriesData ?? {}).filter((s) => {
      const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
      return s.number_of_episodes > 0 && watched >= s.number_of_episodes
    }) as SeriesRow[]
  }, [filters.watched, watchedSeriesData, seriesEpisodes])

  const filteredSeries = useMemo(() => {
    const isWatched = (s: SeriesRow) => {
      const total = totals.get(s.id) ?? 0
      return total > 0 && Object.keys(seriesEpisodes?.[s.id] ?? {}).length >= total
    }
    const runtimeSort = (arr: SeriesRow[]) => {
      if (sort?.key !== 'runtime') return arr
      const unset = sort.dir === 'asc' ? Infinity : -Infinity
      return [...arr].sort((a, b) => {
        const av = runtimes.get(a.id) ?? unset; const bv = runtimes.get(b.id) ?? unset
        return sort.dir === 'asc' ? av - bv : bv - av
      })
    }
    if (isNameSort) {
      const base = filters.watched === 'unwatched' ? visibleSeries.filter((s) => !isWatched(s)) : visibleSeries
      return runtimeSort(applyRuntimeFilter(base, runtimes, filters.runtime_gte))
    }
    if (filters.watched === 'watched') return watchedModeItems.slice((page - 1) * 20, page * 20).filter((s) => s.first_air_date)
    const base = filters.watched === 'unwatched' ? series.filter((s) => !isWatched(s)) : series
    return runtimeSort(applyRuntimeFilter(base, runtimes, filters.runtime_gte))
  }, [visibleSeries, series, filters, seriesEpisodes, totals, watchedModeItems, page, sort, isNameSort, runtimes])

  const displayTotalPages = useMemo(() => {
    if (filters.watched === 'watched') return Math.max(1, Math.ceil(watchedModeItems.length / 20))
    if (isNameSort) {
      const all = nameSortData ?? []
      const filtered = filters.watched === 'unwatched'
        ? all.filter((s) => { const t = totals.get(s.id) ?? 0; return !(t > 0 && Object.keys(seriesEpisodes?.[s.id] ?? {}).length >= t) })
        : all
      return Math.max(1, Math.ceil(applyRuntimeFilter(filtered, runtimes, filters.runtime_gte).length / 20))
    }
    return totalPages
  }, [filters, watchedModeItems, isNameSort, nameSortData, totals, seriesEpisodes, totalPages, runtimes])

  const columns = useSeriesColumns(statuses, totals, runtimes, genreIds, inSearchMode)
  const { isExporting, handleExport } = useSeriesExport(filters, totalPages, totals, statuses)
  const combinedLoading = isNameSort ? nameSortLoading : loading

  return (
    <PageLayout title={t('series.title')} start={<TvIcon size={32} strokeWidth={1.5} />} end={role === 'admin' ? <ExportButton onExport={handleExport} disabled={combinedLoading} /> : undefined}>
      <FiltersPanel
        schema={filtersSchema}
        filters={filters}
        onChange={(next) => { setFilters(next); goToPage(1) }}
        titleKey="series.filters.panel"
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Table<SeriesRow>
          scrollKey={`${page}-${JSON.stringify(filters)}`}
          loading={combinedLoading}
          error={error ?? undefined}
          onRetry={retry}
          emptyMessage={t('series.empty')}
          data={filteredSeries}
          columns={columns}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          sort={sort}
          onSort={handleSort}
          rowClassName={(row) => {
            const total   = totals.get(row.id) ?? 0
            const watched = Object.keys(seriesEpisodes?.[row.id] ?? {}).length
            return (role !== 'admin' && total > 0 && watched >= total) ? '!bg-primary/15 dark:!bg-primary/20 hc:!bg-primary/40' : ''
          }}
          footer={{ page, totalPages: displayTotalPages, onPrev: () => goToPage(page - 1), onNext: () => goToPage(page + 1), onPageChange: goToPage, disabled: combinedLoading }}
        />
      </div>

      {selectedId !== null && <SeriesDetailModal seriesId={selectedId} onClose={() => setSelectedId(null)} totalRuntime={runtimes.get(selectedId)} />}
      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </PageLayout>
  )
}
