'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchSeriesDetail } from '@/features/series/series.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBSeriesDetail } from '@/types/tmdb'

export function useSeriesDetail(id: number | null) {
  const { language } = useLanguageStore()

  const { data: detail, isLoading, isError } = useQuery<TMDBSeriesDetail>({
    queryKey: ['series-detail', id, language],
    queryFn: () => fetchSeriesDetail(id!, language),
    enabled: id !== null,
  })

  return { detail: detail ?? null, loading: isLoading, error: isError ? 'TMDB_FETCH_ERROR' : null }
}
