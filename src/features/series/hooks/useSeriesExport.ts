import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useToastStore } from '@/store/toastStore'
import { fetchSeries, fetchSeriesDetail } from '@/features/series/series.service'
import { applyClientFilters } from '@/features/series/hooks/useSeries'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { formatShortDate } from '@/utils/formatDate'
import { formatVoteCount } from '@/utils/formatNumber'
import { getStatusConfig } from '@/features/series/getSeriesUI'
import type { SeriesFilters, SeriesRow } from '@/types/series'

type SeriesExportRow = SeriesRow & { status: string }

type SeriesCSVRow = {
  name: string
  first_air_date: string
  vote_average: string
  vote_count: string
  original_language: string
  status: string
}
const CSV_FIELDS: (keyof SeriesCSVRow)[] = ['name', 'first_air_date', 'vote_average', 'vote_count', 'original_language', 'status']

export function useSeriesExport(
  filters: SeriesFilters,
  totalPages: number,
  totals: Map<number, number>,
  statuses: Map<number, string>,
) {
  const { t }        = useTranslation()
  const { language } = useLanguageStore()
  const addToast     = useToastStore((s) => s.addToast)
  const userId       = useUserStore((s) => s.userId)
  const userKey      = String(userId ?? 'guest')
  const seriesEpisodes    = useWatchedStore((s) => s.episodes[userKey])
  const watchedSeriesData = useWatchedStore((s) => s.seriesData[userKey])

  const [isExporting, setIsExporting] = useState(false)

  const watchedModeItems = filters.watched === 'watched'
    ? (Object.values(watchedSeriesData ?? {}).filter((s) => {
        const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
        return s.number_of_episodes > 0 && watched >= s.number_of_episodes
      }) as SeriesRow[])
    : null

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      let baseRows: SeriesRow[]

      if (filters.watched === 'watched') {
        baseRows = watchedModeItems ?? []
      } else {
        const pageCount = Math.min(totalPages, 20)
        const pages = await Promise.all(
          Array.from({ length: pageCount }, (_, i) =>
            fetchSeries(i + 1, language, filters).then((raw) => applyClientFilters(raw.results ?? [], filters))
          )
        )
        baseRows = pages.flat()
        if (filters.watched === 'unwatched') {
          baseRows = baseRows.filter((s) => {
            const total   = totals.get(s.id) ?? 0
            const watched = Object.keys(seriesEpisodes?.[s.id] ?? {}).length
            return !(total > 0 && watched >= total)
          })
        }
      }

      const detailResults = await Promise.allSettled(baseRows.map((s) => fetchSeriesDetail(s.id, language)))
      const exportStatuses = new Map<number, string>()
      detailResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value?.status) exportStatuses.set(baseRows[i].id, result.value.status)
      })

      const jsonData: SeriesExportRow[] = baseRows.map((s) => ({ ...s, status: exportStatuses.get(s.id) ?? statuses.get(s.id) ?? '' }))

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
          t('series.columns.title'), t('series.columns.firstAirDate'), t('series.columns.rating'),
          t('series.columns.votes'), t('series.columns.language'), t('series.columns.status'),
        ]
        exportAsCSV(csvData, CSV_FIELDS, `series-${date}.csv`, headers)
      }
      addToast('success', t('export.success'))
    } catch {
      addToast('error', t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }, [filters, totalPages, language, watchedModeItems, seriesEpisodes, totals, statuses, t, addToast])

  return { isExporting, handleExport }
}
