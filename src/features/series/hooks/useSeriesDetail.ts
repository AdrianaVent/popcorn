'use client'

import { useAsync } from '@/hooks/useAsync'
import { fetchSeriesDetail } from '@/features/series/series.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBSeriesDetail } from '@/types/tmdb'

export function useSeriesDetail(id: number | null) {
  const { language } = useLanguageStore()

  const { data: detail, loading, error } = useAsync<TMDBSeriesDetail>(
    () => (id !== null ? fetchSeriesDetail(id, language) : null),
    [id, language],
  )

  return { detail, loading, error }
}
