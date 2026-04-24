'use client'

import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
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
  const [retryCount, setRetryCount] = useState(0)

  const { data, loading, error } = useAsync<FetchResult>(
    () => {
      if (filters.watched === 'watched') return null
      return fetchMovies(page, language, filters).then((raw) => ({
        movies: applyClientFilters(raw.results ?? [], filters),
        totalPages: raw.total_pages ?? 1,
      }))
    },
    [page, language, filters, retryCount],
  )

  return {
    movies: data?.movies ?? [],
    totalPages: data?.totalPages ?? 1,
    loading,
    error,
    page,
    goToPage: setPage,
    retry: () => setRetryCount((c) => c + 1),
  }
}
