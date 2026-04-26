'use client'

import { useState, useMemo } from 'react'
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

import { useMovies } from './hooks/useMovies'
import type { Column } from '@/types/table'
import type { MovieRow, MovieFilters } from '@/types/movie'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useFilters } from '@/hooks/useFilters'

import { movieFiltersSchema } from './movieFilters.schema'

const initialFilters: MovieFilters = {}

export default function MoviesFeature() {
  const { t } = useTranslation()
  const router = useRouter()
  const { language } = useLanguageStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)

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
  const clearUserId = useUserStore((s) => s.clearUserId)
  const userKey = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])

  const PAGE_SIZE = 20

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
    clearUserId()
    router.push('/login')
  }

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
      render: (row) => {
        if (!row.release_date) return null
        const date = new Date(row.release_date)
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
      header: t('movies.columns.rating'),
      render: (row) => `${row.vote_average.toFixed(1)} / 10`,
      width: 'sm',
      align: 'center',
    },
    {
      key: 'vote_count',
      header: t('movies.columns.votes'),
      render: (row) => row.vote_count.toLocaleString(),
      width: 'sm',
      align: 'center',
    },
  ]

  return (
    <DashboardLayout activeNav="movies" onLogout={handleLogout}>
      <div className="h-full flex flex-col gap-4 p-4">

        <Header title={t('movies.title')} />

        <FiltersPanel
          schema={movieFiltersSchema}
          filters={filters}
          onChange={(next) => {
            setFilters(next)
            goToPage(1)
          }}
        />

        <div className="flex-1 min-h-0 overflow-hidden">

          {loading && <Text>Loading...</Text>}

          {!loading && error && (
            <Button variant="secondary" onClick={retry}>
              {t('movies.retry')}
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
    </DashboardLayout>
  )
}