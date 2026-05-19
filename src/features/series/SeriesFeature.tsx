'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import Table from '@/components/ui/Table/Table'
import MediaPoster from '@/components/common/MediaPoster'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import SeriesDetailModal from './components/SeriesDetailModal'

import { useSeries, applyClientFilters } from './hooks/useSeries'
import { fetchSeries, fetchSeriesDetail, fetchSeasonDetail, fetchSeriesWatchProviderOptions } from './series.service'
import { getStatusConfig } from './getSeriesUI'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useToastStore } from '@/store/toastStore'
import { useFilters } from '@/hooks/useFilters'
import { useQuery } from '@tanstack/react-query'
import { staticSeriesFiltersSchema } from './seriesFilters.schema'
import { formatVoteCount, tmdbToStarRating, formatRuntime } from '@/utils/formatNumber'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import { formatShortDate } from '@/utils/formatDate'
import type { Column, SortState } from '@/types/table'
import type { SeriesRow, SeriesFilters } from '@/types/series'
import type { WatchProvider } from '@/types/tmdb'
import PageLayout from '@/components/layouts/PageLayout'
import { TvIcon, EyeIcon, EyeSlashIcon } from '@/components/icons'
import clsx from 'clsx'

type SeriesExportRow = SeriesRow & { status: string }

type SeriesCSVRow = {
  name: string
  first_air_date: string
  vote_average: string
  vote_count: string
  original_language: string
  status: string
}
const SERIES_CSV_FIELDS: (keyof SeriesCSVRow)[] = [
  'name', 'first_air_date', 'vote_average', 'vote_count', 'original_language', 'status',
]

// Name is sorted client-side: TMDB places non-Latin names first in desc order
// (high Unicode code points), so server-side name sort produces empty pages after filtering.
const SERIES_SORT_FIELD: Partial<Record<keyof SeriesRow, string>> = {
  first_air_date: 'first_air_date',
  vote_average:   'vote_average',
  vote_count:     'vote_count',
}

const initialFilters: SeriesFilters = {}

export default function SeriesFeature() {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const addToast = useToastStore((s) => s.addToast)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [statuses, setStatuses] = useState<Map<number, string>>(new Map())
  const [totals, setTotals] = useState<Map<number, number>>(new Map())
  const [runtimes, setRuntimes] = useState<Map<number, number | null>>(new Map())
  const { filters, setFilters } = useFilters<SeriesFilters>(initialFilters)

  const [sort, setSort] = useState<SortState<SeriesRow> | null>(null)
  const inSearchMode = Boolean(filters.title)
  const sortBy = sort && !inSearchMode
    ? `${SERIES_SORT_FIELD[sort.key]}.${sort.dir}`
    : undefined

  const { series, loading, error, page, totalPages, retry, goToPage } = useSeries(filters, sortBy)

  const handleSort = useCallback((key: keyof SeriesRow) => {
    setSort((prev) => prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    goToPage(1)
  }, [goToPage])

  const abortRef = useRef<AbortController | null>(null)

  const PAGE_SIZE = 20

  const isNameSort = sort?.key === 'name' && !inSearchMode && filters.watched !== 'watched'

  const NAME_SORT_PAGE_CAP = 10
  const { data: nameSortData, isLoading: nameSortLoading } = useQuery<SeriesRow[]>({
    queryKey: ['series-name-sort', language, filters],
    queryFn: async () => {
      const first = await fetchSeries(1, language, filters)
      const maxPage = Math.min(first.total_pages ?? 1, NAME_SORT_PAGE_CAP)
      const rest = await Promise.all(
        Array.from({ length: maxPage - 1 }, (_, i) =>
          fetchSeries(i + 2, language, filters)
        )
      )
      const all = [first, ...rest].flatMap((r) => applyClientFilters(r.results ?? [], filters))
      const seen = new Set<number>()
      return all.filter((s) => {
        if (seen.has(s.id)) return false
        seen.add(s.id)
        return true
      })
    },
    enabled: isNameSort,
    staleTime: 5 * 60 * 1000,
  })

  // visibleSeries = items actually shown in the table (used for enrichment).
  // Kept separate from filteredSeries so runtimes/statuses don't create a dep loop.
  const visibleSeries = useMemo(() => {
    if (isNameSort) {
      const all = nameSortData ?? []
      const sorted = [...all].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name)
        return sort!.dir === 'asc' ? cmp : -cmp
      })
      return sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    }
    return series
  }, [isNameSort, nameSortData, page, sort, series])

  useEffect(() => {
    if (!visibleSeries.length) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    Promise.allSettled(
      visibleSeries.map(async (s) => {
        const detail = await fetchSeriesDetail(s.id, language)
        const validSeasons = (detail.seasons ?? []).filter((vs) => vs.air_date && vs.season_number > 0)
        const numEps = validSeasons.reduce((sum, vs) => sum + vs.episode_count, 0)
        const legacyRt = detail.episode_run_time?.[0] || null
        let epRt = legacyRt ?? detail.last_episode_to_air?.runtime ?? null
        if (epRt == null && validSeasons.length > 0) {
          try {
            const seasonDetail = await fetchSeasonDetail(s.id, validSeasons[0].season_number, language)
            const knownRuntimes = seasonDetail.episodes
              .map((e) => e.runtime)
              .filter((r): r is number => r != null && r > 0)
            if (knownRuntimes.length > 0) {
              epRt = Math.round(knownRuntimes.reduce((a: number, b: number) => a + b, 0) / knownRuntimes.length)
            }
          } catch { /* ignore */ }
        }
        return { id: s.id, detail, numEps, epRt }
      })
    ).then((results) => {
      if (controller.signal.aborted) return
      const nextStatuses = new Map<number, string>()
      const nextTotals = new Map<number, number>()
      const nextRuntimes = new Map<number, number | null>()
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { id, detail, numEps, epRt } = result.value
          if (detail.status) nextStatuses.set(id, detail.status)
          if (numEps) nextTotals.set(id, numEps)
          nextRuntimes.set(id, epRt != null && numEps > 0 ? epRt * numEps : null)
        }
      })
      setStatuses(nextStatuses)
      setTotals(nextTotals)
      setRuntimes(nextRuntimes)
    })

    return () => { controller.abort() }
  }, [visibleSeries, language])

  const userId = useUserStore((s) => s.userId)
  const role = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const seriesEpisodes = useWatchedStore((s) => s.episodes[userKey])

  const { data: providerOptions } = useQuery<WatchProvider[]>({ queryKey: ['series-provider-options'], queryFn: fetchSeriesWatchProviderOptions, staleTime: Infinity })

  const filtersSchema = useMemo(() => staticSeriesFiltersSchema.flatMap((field) => {
    if (field.key === 'watched' && role === 'admin') return []
    if (field.key === 'provider_id' && providerOptions?.length) {
      return [{ ...field, options: providerOptions.map((p) => ({ value: String(p.provider_id), label: p.provider_name })) }]
    }
    return [field]
  }), [providerOptions, role])

  const watchedSeriesData = useWatchedStore((s) => s.seriesData[userKey])

  const watchedModeItems = useMemo((): SeriesRow[] => {
    if (filters.watched !== 'watched') return []
    const userSeriesData = watchedSeriesData ?? {}
    return Object.values(userSeriesData).filter((s) => {
      const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
      return s.number_of_episodes > 0 && watched >= s.number_of_episodes
    }) as SeriesRow[]
  }, [filters.watched, watchedSeriesData, seriesEpisodes])

  const filteredSeries = useMemo(() => {
    if (isNameSort) {
      // visibleSeries already has the sorted+paginated name-sort slice; apply watched filter on top
      const base = filters.watched === 'unwatched'
        ? visibleSeries.filter((s) => {
            const total = totals.get(s.id) ?? 0
            const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
            return !(total > 0 && watched >= total)
          })
        : visibleSeries
      if (sort?.key !== 'runtime') return base
      const unset = sort.dir === 'asc' ? Infinity : -Infinity
      return [...base].sort((a, b) => {
        const av = runtimes.get(a.id) ?? unset
        const bv = runtimes.get(b.id) ?? unset
        return sort.dir === 'asc' ? av - bv : bv - av
      })
    }
    if (filters.watched === 'watched') {
      return watchedModeItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((s) => s.first_air_date)
    }
    let result: SeriesRow[]
    if (filters.watched === 'unwatched') {
      result = series.filter((s) => {
        const total = totals.get(s.id) ?? 0
        const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
        return !(total > 0 && watched >= total)
      })
    } else {
      result = series
    }
    if (sort?.key === 'runtime') {
      const unset = sort.dir === 'asc' ? Infinity : -Infinity
      result = [...result].sort((a, b) => {
        const av = runtimes.get(a.id) ?? unset
        const bv = runtimes.get(b.id) ?? unset
        return sort.dir === 'asc' ? av - bv : bv - av
      })
    }
    return result
  }, [visibleSeries, series, filters.watched, seriesEpisodes, totals, watchedModeItems, page, sort, isNameSort, runtimes])

  const displayTotalPages = useMemo(() => {
    if (filters.watched === 'watched') return Math.max(1, Math.ceil(watchedModeItems.length / PAGE_SIZE))
    if (isNameSort) {
      const all = nameSortData ?? []
      const filtered = filters.watched === 'unwatched'
        ? all.filter((s) => {
            const total = totals.get(s.id) ?? 0
            const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
            return !(total > 0 && watched >= total)
          })
        : all
      return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    }
    return totalPages
  }, [filters.watched, watchedModeItems, isNameSort, nameSortData, totals, seriesEpisodes, totalPages])

  const combinedLoading = isNameSort ? nameSortLoading : loading

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      let baseRows: SeriesRow[]

      if (filters.watched === 'watched') {
        baseRows = watchedModeItems
      } else {
        const pageCount = Math.min(totalPages, 20)
        const pages = await Promise.all(
          Array.from({ length: pageCount }, (_, i) =>
            fetchSeries(i + 1, language, filters).then((raw) =>
              applyClientFilters(raw.results ?? [], filters)
            )
          )
        )
        baseRows = pages.flat()
        if (filters.watched === 'unwatched') {
          baseRows = baseRows.filter((s) => {
            const total = totals.get(s.id) ?? 0
            const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
            return !(total > 0 && watched >= total)
          })
        }
      }

      const detailResults = await Promise.allSettled(
        baseRows.map((s) => fetchSeriesDetail(s.id, language))
      )
      const exportStatuses = new Map<number, string>()
      detailResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value?.status) {
          exportStatuses.set(baseRows[i].id, result.value.status)
        }
      })

      const jsonData: SeriesExportRow[] = baseRows.map((s) => ({
        ...s,
        status: exportStatuses.get(s.id) ?? statuses.get(s.id) ?? '',
      }))

      if (format === 'json') {
        exportAsJSON(jsonData, `series-${date}.json`)
      } else {
        const langDisplay = new Intl.DisplayNames([language], { type: 'language' })
        const csvData: SeriesCSVRow[] = jsonData.map((s) => {
          const cfg = getStatusConfig(s.status)
          return {
            name: s.name,
            first_air_date: s.first_air_date ? formatShortDate(s.first_air_date, language) : '',
            vote_average: `${s.vote_average.toFixed(1)} / 10`,
            vote_count: formatVoteCount(s.vote_count, language),
            original_language: langDisplay.of(s.original_language) ?? s.original_language,
            status: cfg ? t(cfg.labelKey) : s.status,
          }
        })
        const headers = [
          t('series.columns.title'),
          t('series.columns.firstAirDate'),
          t('series.columns.rating'),
          t('series.columns.votes'),
          t('series.columns.language'),
          t('series.columns.status'),
        ]
        exportAsCSV(csvData, SERIES_CSV_FIELDS, `series-${date}.csv`, headers)
      }
      addToast('success', t('export.success'))
    } catch {
      addToast('error', t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }, [filters, totalPages, language, watchedModeItems, seriesEpisodes, totals, statuses, t, addToast])

  const columns: Column<SeriesRow>[] = [
    ...(role !== 'admin' ? [{
      key: 'watched' as keyof SeriesRow,
      header: '',
      render: (row: SeriesRow) => {
        const total = totals.get(row.id) ?? 0
        const watched = Object.keys(seriesEpisodes?.[row.id] ?? {}).length
        const isWatched = total > 0 && watched >= total
        return (
          <span className={clsx(
            'flex items-center justify-center w-full transition-colors cursor-pointer',
            isWatched ? 'text-primary hover:opacity-70' : 'text-gray-400 dark:text-gray-500 hover:text-muted-foreground'
          )}>
            {isWatched ? <EyeIcon size={15} strokeWidth={2.5} /> : <EyeSlashIcon size={15} />}
          </span>
        )
      },
      width: 'xs' as const,
      align: 'center' as const,
    }] : []),
    {
      key: 'poster_path',
      header: t('series.columns.poster'),
      render: (row) => <MediaPoster posterPath={row.poster_path} title={row.name} />,
      width: 'xs',
      align: 'center',
    },
    {
      key: 'name',
      header: t('series.columns.title'),
      render: (row) => (
        <span className="block truncate font-medium text-foreground">{row.name}</span>
      ),
      width: 'flex',
      align: 'left',
      sortable: !inSearchMode,
    },
    {
      key: 'first_air_date',
      header: t('series.columns.firstAirDate'),
      render: (row) => row.first_air_date ? formatShortDate(row.first_air_date, language) : null,
      width: 'md',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'runtime',
      header: t('series.columns.runtime'),
      render: (row) => {
        if (!runtimes.has(row.id)) return <span className="inline-block h-3 w-10 rounded bg-muted animate-pulse" />
        const rt = runtimes.get(row.id)
        if (!rt) return <span className="text-muted-foreground">—</span>
        return formatRuntime(rt, language)
      },
      width: 'sm',
      align: 'center',
      sortable: true,
    },
    {
      key: 'vote_average',
      header: t('series.columns.rating'),
      render: (row) => (
        <Tooltip content={`${row.vote_average.toFixed(1)} / 10`} placement="top">
          <div className="flex justify-center">
            <StarRating value={tmdbToStarRating(row.vote_average)} readonly size={14} />
          </div>
        </Tooltip>
      ),
      width: 'md',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'vote_count',
      header: t('series.columns.votes'),
      render: (row) => formatVoteCount(row.vote_count, language),
      width: 'sm',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'status',
      header: t('series.columns.status'),
      render: (row) => {
        const status = statuses.get(row.id)
        if (status === undefined) {
          return (
            <span className="inline-block h-5 w-16 rounded bg-muted animate-pulse" />
          )
        }
        const cfg = getStatusConfig(status)
        if (!cfg) return <span className="text-muted-foreground">—</span>
        return (
          <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium whitespace-nowrap ${cfg.border} ${cfg.bg} ${cfg.text}`}>
            {t(cfg.labelKey)}
          </span>
        )
      },
      width: 'md',
      align: 'center',
    },
  ]

  return (
    <PageLayout title={t('series.title')} start={<TvIcon size={32} strokeWidth={1.5} />} end={role === 'admin' ? <ExportButton onExport={handleExport} disabled={combinedLoading} /> : undefined}>
      <FiltersPanel
        schema={filtersSchema}
        filters={filters}
        onChange={(next) => {
          setFilters(next)
          goToPage(1)
        }}
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
          rowClassName={() => ''}
          footer={{
            page,
            totalPages: displayTotalPages,
            onPrev: () => goToPage(page - 1),
            onNext: () => goToPage(page + 1),
            onPageChange: goToPage,
            disabled: combinedLoading,
          }}
        />
      </div>

      {selectedId !== null && (
        <SeriesDetailModal
          seriesId={selectedId}
          onClose={() => setSelectedId(null)}
          totalRuntime={runtimes.get(selectedId)}
        />
      )}

      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </PageLayout>
  )
}
