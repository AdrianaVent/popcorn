import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useToastStore } from '@/store/toastStore'
import { fetchMovies } from '@/features/movies/movies.service'
import { applyClientFilters } from '@/features/movies/hooks/useMovies'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { formatShortDate } from '@/utils/formatDate'
import { formatVoteCount } from '@/utils/formatNumber'
import type { MovieFilters } from '@/types/movie'
import type { MovieRow } from '@/types/movie'

type MovieCSVRow = {
  title: string
  release_date: string
  vote_average: string
  vote_count: string
  original_language: string
}

const CSV_FIELDS: (keyof MovieCSVRow)[] = ['title', 'release_date', 'vote_average', 'vote_count', 'original_language']

export function useMovieExport(filters: MovieFilters, totalPages: number) {
  const { t }      = useTranslation()
  const { language } = useLanguageStore()
  const addToast   = useToastStore((s) => s.addToast)
  const userId     = useUserStore((s) => s.userId)
  const userKey    = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])

  const [isExporting, setIsExporting] = useState(false)

  const watchedModeItems = filters.watched === 'watched'
    ? (Object.values(watchedMovies ?? {}) as MovieRow[])
    : null

  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      let allMovies: MovieRow[]

      if (filters.watched === 'watched') {
        allMovies = watchedModeItems ?? []
      } else {
        const pageCount = Math.min(totalPages, 20)
        const pages = await Promise.all(
          Array.from({ length: pageCount }, (_, i) =>
            fetchMovies(i + 1, language, filters).then((raw) => applyClientFilters(raw.results ?? [], filters))
          )
        )
        allMovies = pages.flat()
        if (filters.watched === 'unwatched') allMovies = allMovies.filter((m) => !watchedMovies?.[m.id])
      }

      if (format === 'json') {
        exportAsJSON(allMovies, `movies-${date}.json`)
      } else {
        const langDisplay = new Intl.DisplayNames([language], { type: 'language' })
        const csvRows: MovieCSVRow[] = allMovies.map((m) => ({
          title: m.title,
          release_date: m.release_date ? formatShortDate(m.release_date, language) : '',
          vote_average: `${m.vote_average.toFixed(1)} / 10`,
          vote_count: formatVoteCount(m.vote_count, language),
          original_language: langDisplay.of(m.original_language) ?? m.original_language,
        }))
        const headers = [t('movies.columns.title'), t('movies.columns.releaseDate'), t('movies.columns.rating'), t('movies.columns.votes'), t('movies.columns.language')]
        exportAsCSV(csvRows, CSV_FIELDS, `movies-${date}.csv`, headers)
      }
      addToast('success', t('export.success'))
    } catch {
      addToast('error', t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }, [filters, totalPages, language, watchedModeItems, watchedMovies, t, addToast])

  return { isExporting, handleExport }
}
