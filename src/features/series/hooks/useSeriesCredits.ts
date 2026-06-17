'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchSeriesCredits } from '@/features/series/series.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBCredits } from '@/types/tmdb'

export function useSeriesCredits(id: number | null) {
  const { language } = useLanguageStore()

  const { data } = useQuery<TMDBCredits>({
    queryKey: ['series-credits', id, language],
    queryFn: () => fetchSeriesCredits(id!, language),
    enabled: id !== null,
    staleTime: 1000 * 60 * 60 * 24, // 24h — credits don't change
  })

  return {
    cast: data?.cast ?? [],
    crew: data?.crew ?? [],
  }
}
