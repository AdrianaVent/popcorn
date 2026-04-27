'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import Table from '@/components/ui/Table/Table'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import Header from '@/components/ui/Header'
import MediaPoster from '@/components/common/MediaPoster'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import SeriesDetailModal from './components/SeriesDetailModal'

import { useSeries, applyClientFilters } from './hooks/useSeries'
import { fetchSeries, fetchSeriesDetail } from './series.service'
import { getStatusConfig } from './getSeriesUI'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useFilters } from '@/hooks/useFilters'
import { seriesFiltersSchema } from './seriesFilters.schema'
import { formatVoteCount } from '@/utils/formatNumber'
import { formatShortDate } from '@/utils/formatDate'
import type { Column } from '@/types/table'
import type { SeriesRow, SeriesFilters } from '@/types/series'

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

const initialFilters: SeriesFilters = {}

export default function SeriesFeature() {
  const { t } = useTranslation()
  const router = useRouter()
  const { language } = useLanguageStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [statuses, setStatuses] = useState<Map<number, string>>(new Map())
  const [totals, setTotals] = useState<Map<number, number>>(new Map())
  const { filters, setFilters } = useFilters<SeriesFilters>(initialFilters)

  const { series, loading, error, page, totalPages, retry, goToPage } = useSeries(filters)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!series.length) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    Promise.allSettled(
      series.map((s) => fetchSeriesDetail(s.id, language))
    ).then((results) => {
      if (controller.signal.aborted) return
      const nextStatuses = new Map<number, string>()
      const nextTotals = new Map<number, number>()
      results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          if (result.value.status) nextStatuses.set(series[i].id, result.value.status)
          if (result.value.number_of_episodes) nextTotals.set(series[i].id, result.value.number_of_episodes)
        }
      })
      setStatuses(nextStatuses)
      setTotals(nextTotals)
    })

    return () => { controller.abort() }
  }, [series, language])

  const userId = useUserStore((s) => s.userId)
  const role = useUserStore((s) => s.role)
  const clearUser = useUserStore((s) => s.clearUser)
  const userKey = String(userId ?? 'guest')
  const seriesEpisodes = useWatchedStore((s) => s.episodes[userKey])

  const PAGE_SIZE = 20

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
    if (filters.watched === 'watched') {
      // store items: filter date as safety net (applyClientFilters doesn't run in this path)
      return watchedModeItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((s) => s.first_air_date)
    }
    if (filters.watched === 'unwatched') {
      return series.filter((s) => {
        const total = totals.get(s.id) ?? 0
        const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
        return !(total > 0 && watched >= total)
      })
    }
    return series
  }, [series, filters.watched, seriesEpisodes, totals, watchedModeItems, page])

  const displayTotalPages = filters.watched === 'watched'
    ? Math.max(1, Math.ceil(watchedModeItems.length / PAGE_SIZE))
    : totalPages

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearUser()
    router.push('/login')
  }

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
          t('series.columns.name'),
          t('series.columns.firstAirDate'),
          t('series.columns.rating'),
          t('series.columns.votes'),
          t('series.columns.language'),
          t('series.columns.status'),
        ]
        exportAsCSV(csvData, SERIES_CSV_FIELDS, `series-${date}.csv`, headers)
      }
    } finally {
      setIsExporting(false)
    }
  }, [filters, totalPages, language, watchedModeItems, seriesEpisodes, totals, statuses, t])

  const columns: Column<SeriesRow>[] = [
    {
      key: 'poster_path',
      header: t('series.columns.poster'),
      render: (row) => {
        const total = totals.get(row.id) ?? 0
        const watched = Object.keys(seriesEpisodes?.[row.id] ?? {}).length
        const allWatched = total > 0 && watched >= total
        return (
          <div className="relative inline-block">
            <MediaPoster posterPath={row.poster_path} title={row.name} />
            {allWatched && (
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        )
      },
      width: 'xs',
      align: 'center',
    },
    {
      key: 'name',
      header: t('series.columns.name'),
      render: (row) => (
        <span className="block truncate font-medium text-foreground">{row.name}</span>
      ),
      width: 'flex',
      align: 'left',
    },
    {
      key: 'first_air_date',
      header: t('series.columns.firstAirDate'),
      render: (row) => row.first_air_date ? formatShortDate(row.first_air_date, language) : null,
      width: 'md',
      align: 'center',
    },
    {
      key: 'vote_average',
      header: t('series.columns.rating'),
      render: (row) => `${row.vote_average.toFixed(1)} / 10`,
      width: 'sm',
      align: 'center',
    },
    {
      key: 'vote_count',
      header: t('series.columns.votes'),
      render: (row) => formatVoteCount(row.vote_count, language),
      width: 'sm',
      align: 'center',
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
    <DashboardLayout activeNav="series" onLogout={handleLogout}>
      <div className="h-full flex flex-col gap-4 p-4">

        <Header title={t('series.title')} end={role === 'admin' ? <ExportButton onExport={handleExport} /> : undefined} />

        <FiltersPanel
          schema={seriesFiltersSchema}
          filters={filters}
          onChange={(next) => {
            setFilters(next)
            goToPage(1)
          }}
          titleKey="series.filters.panel"
        />

        <div className="flex-1 min-h-0 overflow-hidden">

          {loading && <Text>Loading...</Text>}

          {!loading && error && (
            <Button variant="secondary" onClick={retry}>
              {t('series.retry')}
            </Button>
          )}

          {!loading && !error && filteredSeries.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <Text variant="body" className="text-muted-foreground">
                {t('series.empty')}
              </Text>
            </div>
          )}

          {!loading && !error && filteredSeries.length > 0 && (
            <Table<SeriesRow>
              data={filteredSeries}
              columns={columns}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedId(row.id)}
              rowClassName={(row) => {
                const total = totals.get(row.id) ?? 0
                const watched = Object.keys(seriesEpisodes?.[row.id] ?? {}).length
                return total > 0 && watched >= total ? 'opacity-60' : ''
              }}
              footer={{
                page,
                totalPages: displayTotalPages,
                onPrev: () => goToPage(page - 1),
                onNext: () => goToPage(page + 1),
                onPageChange: goToPage,
              }}
            />
          )}

        </div>
      </div>

      {selectedId !== null && (
        <SeriesDetailModal
          seriesId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </DashboardLayout>
  )
}
