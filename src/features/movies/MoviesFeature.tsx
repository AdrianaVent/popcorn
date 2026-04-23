'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

import DashboardLayout from '@/components/layouts/DashboardLayout'
import Table from '@/components/ui/Table/Table'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import Header from '@/components/ui/Header'
import MovieDetailModal from './components/MovieDetailModal'
import MoviePoster from './components/MoviePoster'
import FiltersPanel from '@/components/common/FiltersPanel'

import { useMovies } from './hooks/useMovies'
import type { Column } from '@/types/table'
import type { MovieRow, MovieFilters } from '@/types/movie'
import { useLanguageStore } from '@/store/languageStore'
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const columns: Column<MovieRow>[] = [
    {
      key: 'poster_path',
      header: t('movies.columns.poster'),
      render: (row) => (
        <MoviePoster posterPath={row.poster_path} title={row.title} />
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
        if (!row.release_date) return '—'
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

          {!loading && !error && movies.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <Text variant="body" className="text-muted-foreground">
                {t('movies.empty')}
              </Text>
            </div>
          )}

          {!loading && !error && movies.length > 0 && (
            <Table<MovieRow>
              data={movies}
              columns={columns}
              getRowKey={(row) => row.id}
              onRowClick={(row) => setSelectedId(row.id)}
              footer={{
                page,
                totalPages,
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