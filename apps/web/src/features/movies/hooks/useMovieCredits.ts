'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMovieCredits } from '@/features/movies/movies.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBCredits } from '@/types/tmdb'

export function useMovieCredits(id: number | null) {
  const { language } = useLanguageStore()

  const { data } = useQuery<TMDBCredits>({
    queryKey: ['movie-credits', id, language],
    queryFn: () => fetchMovieCredits(id!, language),
    enabled: id !== null,
    staleTime: 1000 * 60 * 60 * 24, // 24h — credits don't change
  })

  return {
    cast: data?.cast ?? [],
    crew: data?.crew ?? [],
  }
}
