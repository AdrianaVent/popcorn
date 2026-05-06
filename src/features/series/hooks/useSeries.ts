'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSeries } from '@/features/series/series.service'
import { useLanguageStore } from '@/store/languageStore'
import { ALLOWED_ORIGINAL_LANGUAGES } from '@/config/constants'
import type { SeriesFilters, SeriesRow } from '@/types/series'
import type { TMDBSeries } from '@/types/tmdb'

type FetchResult = { series: SeriesRow[]; totalPages: number }

export function applyClientFilters(results: TMDBSeries[], filters: SeriesFilters): SeriesRow[] {
  let items = results.filter((s) => s.first_air_date)
  // /search/tv ignores with_original_language — filter client-side
  if (filters.title) {
    items = items.filter((s) => ALLOWED_ORIGINAL_LANGUAGES.has(s.original_language))
  }
  // vote_average_gte not supported by /search/tv
  if (filters.title && filters.vote_average_gte) {
    items = items.filter((s) => s.vote_average >= (filters.vote_average_gte ?? 0))
  }
  return items as SeriesRow[]
}

export function useSeries(filters: SeriesFilters) {
  const { language } = useLanguageStore()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery<FetchResult>({
    queryKey: ['series', page, language, filters],
    queryFn: () =>
      fetchSeries(page, language, filters).then((raw) => ({
        series: applyClientFilters(raw.results ?? [], filters),
        totalPages: raw.total_pages ?? 1,
      })),
    enabled: filters.watched !== 'watched',
  })

  return {
    series: data?.series ?? [],
    totalPages: data?.totalPages ?? 1,
    loading: isLoading,
    error: isError ? 'TMDB_FETCH_ERROR' : null,
    page,
    goToPage: setPage,
    retry: refetch,
  }
}
