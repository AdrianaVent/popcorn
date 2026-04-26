'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import Table from '@/components/ui/Table/Table'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import Header from '@/components/ui/Header'
import MediaPoster from '@/components/common/MediaPoster'
import FiltersPanel from '@/components/common/FiltersPanel'
import SeriesDetailModal from './components/SeriesDetailModal'

import { useSeries } from './hooks/useSeries'
import { fetchSeriesDetail } from './series.service'
import { getStatusConfig } from './getSeriesUI'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useFilters } from '@/hooks/useFilters'
import { seriesFiltersSchema } from './seriesFilters.schema'
import type { Column } from '@/types/table'
import type { SeriesRow, SeriesFilters } from '@/types/series'

const initialFilters: SeriesFilters = {}

export default function SeriesFeature() {
  const { t } = useTranslation()
  const router = useRouter()
  const { language } = useLanguageStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)
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
  const clearUserId = useUserStore((s) => s.clearUserId)
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
    clearUserId()
    router.push('/login')
  }

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
      render: (row) => {
        if (!row.first_air_date) return null
        const date = new Date(row.first_air_date)
        const day = String(date.getUTCDate()).padStart(2, '0')
        const month = date.toLocaleDateString(language, { month: 'short' })
        const year = date.getUTCFullYear()
        return `${day} ${month} ${year}`
      },
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
      render: (row) => row.vote_count.toLocaleString(),
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

        <Header title={t('series.title')} />

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
    </DashboardLayout>
  )
}
