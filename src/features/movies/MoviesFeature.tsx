'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import Table from '@/components/ui/Table/Table'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import Header from '@/components/ui/Header'
import MovieDetailModal from './components/MovieDetailModal'
import MediaPoster from '@/components/common/MediaPoster'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

import { useMovies, applyClientFilters } from './hooks/useMovies'
import { fetchMovies, fetchMovieWatchProviderOptions } from './movies.service'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import type { Column } from '@/types/table'
import type { MovieRow, MovieFilters } from '@/types/movie'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useToastStore } from '@/store/toastStore'
import { useFilters } from '@/hooks/useFilters'
import { useAsync } from '@/hooks/useAsync'

import { staticMovieFiltersSchema } from './movieFilters.schema'
import { formatVoteCount } from '@/utils/formatNumber'
import { formatShortDate } from '@/utils/formatDate'

type MovieCSVRow = {
  title: string
  release_date: string
  vote_average: string
  vote_count: string
  original_language: string
}
const MOVIE_CSV_FIELDS: (keyof MovieCSVRow)[] = [
  'title', 'release_date', 'vote_average', 'vote_count', 'original_language',
]

const initialFilters: MovieFilters = {}

export default function MoviesFeature() {
  const { t } = useTranslation()
  const router = useRouter()
  const { language } = useLanguageStore()
  const addToast = useToastStore((s) => s.addToast)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { filters, setFilters } = useFilters<MovieFilters>(initialFilters)

  const {
    movies,
    loading,
    error,
    page,
    totalPages,
    retry,
    goToPage,
  } = useMovies(filters)

  const userId = useUserStore((s) => s.userId)
  const role = useUserStore((s) => s.role)
  const clearUser = useUserStore((s) => s.clearUser)
  const userKey = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])

  const PAGE_SIZE = 20

  const { data: providerOptions } = useAsync(() => fetchMovieWatchProviderOptions(), [])

  const filtersSchema = useMemo(() => staticMovieFiltersSchema.map((field) => {
    if (field.key === 'provider_id' && providerOptions?.length) {
      return { ...field, options: providerOptions.map((p) => ({ value: String(p.provider_id), label: p.provider_name })) }
    }
    return field
  }), [providerOptions])

  // "watched" mode: use local store data with local pagination, skip TMDB
  const watchedModeItems = useMemo(() => {
    if (filters.watched !== 'watched') return null
    return Object.values(watchedMovies ?? {}) as MovieRow[]
  }, [filters.watched, watchedMovies])

  const filteredMovies = useMemo(() => {
    if (filters.watched === 'watched') {
      // store items: filter date as safety net (applyClientFilters doesn't run in this path)
      return (watchedModeItems ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((m) => m.release_date)
    }
    if (filters.watched === 'unwatched') {
      return movies.filter((m) => !watchedMovies?.[m.id])
    }
    return movies
  }, [movies, filters.watched, watchedMovies, watchedModeItems, page])

  const displayTotalPages = filters.watched === 'watched'
    ? Math.max(1, Math.ceil((watchedModeItems?.length ?? 0) / PAGE_SIZE))
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
      let allMovies: MovieRow[]

      if (filters.watched === 'watched') {
        allMovies = watchedModeItems ?? []
      } else {
        const pageCount = Math.min(totalPages, 20)
        const pages = await Promise.all(
          Array.from({ length: pageCount }, (_, i) =>
            fetchMovies(i + 1, language, filters).then((raw) =>
              applyClientFilters(raw.results ?? [], filters)
            )
          )
        )
        allMovies = pages.flat()
        if (filters.watched === 'unwatched') {
          allMovies = allMovies.filter((m) => !watchedMovies?.[m.id])
        }
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
        const headers = [
          t('movies.columns.title'),
          t('movies.columns.releaseDate'),
          t('movies.columns.rating'),
          t('movies.columns.votes'),
          t('movies.columns.language'),
        ]
        exportAsCSV(csvRows, MOVIE_CSV_FIELDS, `movies-${date}.csv`, headers)
      }
      addToast('success', t('export.success'))
    } catch {
      addToast('error', t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }, [filters, totalPages, language, watchedModeItems, watchedMovies, t, addToast])

  const columns: Column<MovieRow>[] = [
    {
      key: 'poster_path',
      header: t('movies.columns.poster'),
      render: (row) => (
        <div className="relative inline-block">
          <MediaPoster posterPath={row.poster_path} title={row.title} />
          {watchedMovies?.[row.id] && (
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
      ),
      width: 'xs',
      align: 'center',
    },
    {
      key: 'title',
      header: t('movies.columns.title'),
      render: (row) => (
        <span className="block truncate font-medium text-foreground">
          {row.title}
        </span>
      ),
      width: 'flex',
      align: 'left',
    },
    {
      key: 'release_date',
      header: t('movies.columns.releaseDate'),
      render: (row) => row.release_date ? formatShortDate(row.release_date, language) : null,
      width: 'md',
      align: 'center',
    },
    {
      key: 'vote_average',
      header: t('movies.columns.rating'),
      render: (row) => `${row.vote_average.toFixed(1)} / 10`,
      width: 'sm',
      align: 'center',
    },
    {
      key: 'vote_count',
      header: t('movies.columns.votes'),
      render: (row) => formatVoteCount(row.vote_count, language),
      width: 'sm',
      align: 'center',
    },
  ]

  return (
    <DashboardLayout activeNav="movies" onLogout={handleLogout}>
      <div className="h-full flex flex-col gap-4 p-4">

        <Header title={t('movies.title')} end={role === 'admin' ? <ExportButton onExport={handleExport} /> : undefined} />

        <FiltersPanel
          schema={filtersSchema}
          filters={filters}
          onChange={(next) => {
            setFilters(next)
            goToPage(1)
          }}
        />

        <div className="flex-1 min-h-0 overflow-hidden">

          {loading && <Text>{t('movies.loading')}</Text>}

          {!loading && error && (
            <Button variant="secondary" onClick={retry}>
              {t('common.retry')}
            </Button>
          )}

          {!loading && !error && filteredMovies.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <Text variant="body" className="text-muted-foreground">
                {t('movies.empty')}
              </Text>
            </div>
          )}

          {!loading && !error && filteredMovies.length > 0 && (
            <Table<MovieRow>
              data={filteredMovies}
              columns={columns}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedId(row.id)}
              rowClassName={(row) => watchedMovies?.[row.id] ? 'opacity-60' : ''}
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
        <MovieDetailModal
          movieId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </DashboardLayout>
  )
}