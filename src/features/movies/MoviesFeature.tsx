'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import Table from '@/components/ui/Table/Table'
import MovieDetailModal from './components/MovieDetailModal'
import FiltersPanel from '@/components/common/FiltersPanel'
import ExportButton from '@/components/common/ExportButton'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

import { useMovies, applyClientFilters } from './hooks/useMovies'
import { fetchMovies, fetchMovieWatchProviderOptions } from './movies.service'
import { useMovieRuntimeEnrichment } from './hooks/useMovieRuntimeEnrichment'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import type { Column, SortState } from '@/types/table'
import type { MovieRow, MovieFilters } from '@/types/movie'
import type { WatchProvider } from '@/types/tmdb'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useToastStore } from '@/store/toastStore'
import { useFilters } from '@/hooks/useFilters'
import { useFilterSchema } from '@/hooks/useFilterSchema'
import { useQuery } from '@tanstack/react-query'

import { staticMovieFiltersSchema } from './movieFilters.schema'
import { resolveGenreName, MOVIE_GENRE_IDS } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import { formatVoteCount, tmdbToStarRating, formatRuntime } from '@/utils/formatNumber'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import { formatShortDate } from '@/utils/formatDate'
import PageLayout from '@/components/layouts/PageLayout'
import { FilmIcon } from '@/components/icons'
import { TitleCell, GenresCell, PosterCell } from '@/components/common/MediaTableCells'

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

// Title is sorted client-side: TMDB places non-Latin titles first in desc order
// (high Unicode code points), so server-side title sort produces empty pages after filtering.
const MOVIE_SORT_FIELD: Partial<Record<keyof MovieRow, string>> = {
  release_date: 'primary_release_date',
  vote_average: 'vote_average',
  vote_count:   'vote_count',
}

const initialFilters: MovieFilters = {}

export default function MoviesFeature() {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const addToast = useToastStore((s) => s.addToast)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { filters, setFilters } = useFilters<MovieFilters>(initialFilters)

  const [sort, setSort] = useState<SortState<MovieRow> | null>(null)
  // In search mode TMDB /search/movie ignores sort_by — sort is disabled
  const inSearchMode = Boolean(filters.title)
  const sortBy = sort && !inSearchMode
    ? `${MOVIE_SORT_FIELD[sort.key]}.${sort.dir}`
    : undefined

  const {
    movies,
    loading,
    error,
    page,
    totalPages,
    retry,
    goToPage,
  } = useMovies(filters, sortBy)

  const handleSort = useCallback((key: keyof MovieRow) => {
    setSort((prev) => prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    goToPage(1)
  }, [goToPage])

  const userId = useUserStore((s) => s.userId)
  const role = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const watchedMovies  = useWatchedStore((s) => s.movies[userKey])

  const PAGE_SIZE = 20

  const { data: providerOptions } = useQuery<WatchProvider[]>({ queryKey: ['movie-provider-options'], queryFn: fetchMovieWatchProviderOptions, staleTime: Infinity })

  const genreOptions = useMemo(
    () => MOVIE_GENRE_IDS.map((id) => ({
      value: id,
      label: resolveGenreName(id, language),
      icon: getGenreIcon(id) ?? undefined,
    })),
    [language],
  )

  const filtersSchema = useFilterSchema(staticMovieFiltersSchema, { role, providerOptions, genreOptions })

  const watchedModeItems = useMemo(() => {
    if (filters.watched !== 'watched') return null
    return Object.values(watchedMovies ?? {}) as MovieRow[]
  }, [filters.watched, watchedMovies])

  const isTitleSort = sort?.key === 'title' && !inSearchMode && filters.watched !== 'watched'

  const TITLE_SORT_PAGE_CAP = 10
  const { data: titleSortData, isLoading: titleSortLoading } = useQuery<MovieRow[]>({
    queryKey: ['movies-title-sort', language, filters],
    queryFn: async () => {
      const first = await fetchMovies(1, language, filters)
      const maxPage = Math.min(first.total_pages ?? 1, TITLE_SORT_PAGE_CAP)
      const rest = await Promise.all(
        Array.from({ length: maxPage - 1 }, (_, i) =>
          fetchMovies(i + 2, language, filters)
        )
      )
      const all = [first, ...rest].flatMap((r) => applyClientFilters(r.results ?? [], filters))
      const seen = new Set<number>()
      return all.filter((m) => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })
    },
    enabled: isTitleSort,
    staleTime: 5 * 60 * 1000,
  })

  // visibleMovies = items shown in the table without runtime sort (used for enrichment).
  // Kept separate so runtimes state changes don't retrigger the enrichment useEffect.
  const visibleMovies = useMemo(() => {
    if (isTitleSort) {
      const all = titleSortData ?? []
      const sorted = [...all].sort((a, b) => {
        const cmp = a.title.localeCompare(b.title)
        return sort!.dir === 'asc' ? cmp : -cmp
      })
      const filtered = filters.watched === 'unwatched' ? sorted.filter((m) => !watchedMovies?.[m.id]) : sorted
      return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    }
    if (filters.watched === 'watched') {
      return (watchedModeItems ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((m) => m.release_date)
    }
    if (filters.watched === 'unwatched') return movies.filter((m) => !watchedMovies?.[m.id])
    return movies
  }, [movies, filters.watched, watchedMovies, watchedModeItems, page, sort, isTitleSort, titleSortData])

  const runtimes = useMovieRuntimeEnrichment(visibleMovies, language)

  const filteredMovies = useMemo(() => {
    if (sort?.key !== 'runtime') return visibleMovies
    const unset = sort.dir === 'asc' ? Infinity : -Infinity
    return [...visibleMovies].sort((a, b) => {
      const av = runtimes.get(a.id) ?? unset
      const bv = runtimes.get(b.id) ?? unset
      return sort.dir === 'asc' ? av - bv : bv - av
    })
  }, [visibleMovies, sort, runtimes])

  const displayTotalPages = useMemo(() => {
    if (filters.watched === 'watched') return Math.max(1, Math.ceil((watchedModeItems?.length ?? 0) / PAGE_SIZE))
    if (isTitleSort) {
      const all = titleSortData ?? []
      const filtered = filters.watched === 'unwatched' ? all.filter((m) => !watchedMovies?.[m.id]) : all
      return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    }
    return totalPages
  }, [filters.watched, watchedModeItems, isTitleSort, titleSortData, watchedMovies, totalPages])

  const combinedLoading = isTitleSort ? titleSortLoading : loading

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
        <PosterCell
          posterPath={row.poster_path}
          title={row.title}
          isWatched={role !== 'admin' && !!watchedMovies?.[row.id]}
        />
      ),
      width: 'xs',
      align: 'center',
    },
    {
      key: 'title',
      header: t('movies.columns.title'),
      render: (row) => <TitleCell title={row.title} />,
      width: 'flex',
      align: 'left',
      sortable: !inSearchMode,
    },
    {
      key: 'genre_ids',
      header: t('movies.columns.genres'),
      render: (row) => <GenresCell genreIds={row.genre_ids as number[] | undefined} language={language} />,
      width: 'md',
      align: 'left',
    },
    {
      key: 'vote_average',
      header: t('movies.columns.rating'),
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
      key: 'release_date',
      header: t('movies.columns.releaseDate'),
      render: (row) => row.release_date ? formatShortDate(row.release_date, language) : null,
      width: 'md',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'runtime',
      header: t('movies.columns.runtime'),
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
  ]

  return (
    <PageLayout title={t('movies.title')} start={<FilmIcon size={32} strokeWidth={1.5} />} end={role === 'admin' ? <ExportButton onExport={handleExport} disabled={combinedLoading} /> : undefined}>
      <FiltersPanel
        schema={filtersSchema}
        filters={filters}
        onChange={(next) => {
          setFilters(next)
          goToPage(1)
        }}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <Table<MovieRow>
          scrollKey={`${page}-${JSON.stringify(filters)}`}
          loading={combinedLoading}
          error={error ?? undefined}
          onRetry={retry}
          emptyMessage={t('movies.empty')}
          data={filteredMovies}
          columns={columns}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          rowClassName={() => ''}
          sort={sort}
          onSort={handleSort}
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
        <MovieDetailModal
          movieId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {isExporting && <LoadingOverlay message={t('export.loading')} />}
    </PageLayout>
  )
}
