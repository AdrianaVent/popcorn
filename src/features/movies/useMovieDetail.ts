'use client'

import { useAsync } from '@/hooks/useAsync'
import { fetchMovieDetail } from './movies.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBMovieDetail } from '@/types/tmdb'

export function useMovieDetail(id: number | null) {
  const { language } = useLanguageStore()

  const { data: detail, loading, error } = useAsync<TMDBMovieDetail>(
    () => (id !== null ? fetchMovieDetail(id, language) : null),
    [id, language],
  )

  return { detail, loading, error }
}
