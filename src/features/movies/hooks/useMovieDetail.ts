'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMovieDetail } from '@/features/movies/movies.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBMovieDetail } from '@/types/tmdb'

export function useMovieDetail(id: number | null) {
  const { language } = useLanguageStore()

  const { data: detail, isLoading, isError } = useQuery<TMDBMovieDetail>({
    queryKey: ['movie-detail', id, language],
    queryFn: () => fetchMovieDetail(id!, language),
    enabled: id !== null,
  })

  return { detail: detail ?? null, loading: isLoading, error: isError ? 'TMDB_FETCH_ERROR' : null }
}
