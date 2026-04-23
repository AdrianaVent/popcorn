'use client'

import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { fetchMovies } from './movies.service'
import { useLanguageStore } from '@/store/languageStore'
import type { MovieFilters, MovieRow } from '@/types/movie'
import type { TMDBMovie } from '@/types/tmdb'

type FetchResult = { movies: MovieRow[]; totalPages: number }

export function applyClientFilters(results: TMDBMovie[], filters: MovieFilters): MovieRow[] {
  // vote_average_gte applied client-side only in search mode (title present) because
  // /search/movie doesn't support the vote_average.gte param
  if (!filters.title || !filters.vote_average_gte) return results as MovieRow[]
  return results.filter((m) => m.vote_average >= (filters.vote_average_gte ?? 0)) as MovieRow[]
}

export function useMovies(filters: MovieFilters) {
  const { language } = useLanguageStore()
  const [page, setPage] = useState(1)
  const [retryCount, setRetryCount] = useState(0)

  const { data, loading, error } = useAsync<FetchResult>(
    () =>
      fetchMovies(page, language, filters).then((raw) => ({
        movies: applyClientFilters(raw.results ?? [], filters),
        totalPages: raw.total_pages ?? 1,
      })),
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
