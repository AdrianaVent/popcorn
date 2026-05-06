'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovies } from '@/features/movies/movies.service'
import { useLanguageStore } from '@/store/languageStore'
import { ALLOWED_ORIGINAL_LANGUAGES } from '@/config/constants'
import type { MovieFilters, MovieRow } from '@/types/movie'
import type { TMDBMovie } from '@/types/tmdb'

type FetchResult = { movies: MovieRow[]; totalPages: number }

export function applyClientFilters(results: TMDBMovie[], filters: MovieFilters): MovieRow[] {
  let items = results.filter((m) => m.release_date)
  // /search/movie ignores with_original_language — filter client-side
  if (filters.title) {
    items = items.filter((m) => ALLOWED_ORIGINAL_LANGUAGES.has(m.original_language))
  }
  // vote_average_gte not supported by /search/movie
  if (filters.title && filters.vote_average_gte) {
    items = items.filter((m) => m.vote_average >= (filters.vote_average_gte ?? 0))
  }
  return items as MovieRow[]
}

export function useMovies(filters: MovieFilters) {
  const { language } = useLanguageStore()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery<FetchResult>({
    queryKey: ['movies', page, language, filters],
    queryFn: () =>
      fetchMovies(page, language, filters).then((raw) => ({
        movies: applyClientFilters(raw.results ?? [], filters),
        totalPages: raw.total_pages ?? 1,
      })),
    enabled: filters.watched !== 'watched',
  })

  return {
    movies: data?.movies ?? [],
    totalPages: data?.totalPages ?? 1,
    loading: isLoading,
    error: isError ? 'TMDB_FETCH_ERROR' : null,
    page,
    goToPage: setPage,
    retry: refetch,
  }
}
