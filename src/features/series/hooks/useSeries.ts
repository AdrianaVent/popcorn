'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSeries } from '@/features/series/series.service'
import { useLanguageStore } from '@/store/languageStore'
import { ALLOWED_ORIGINAL_LANGUAGES } from '@/config/constants'
import type { SeriesFilters, SeriesRow } from '@/types/series'
import type { TMDBSeries } from '@/types/tmdb'

type FetchResult = { series: SeriesRow[]; totalPages: number }

// Returns true if the string contains characters outside Basic Latin + Latin Extended
// (U+0000-U+024F) and General Punctuation (U+2000-U+206F, covers em-dash, smart quotes, etc.).
// Rejects Hebrew, Cyrillic, Arabic, CJK, Korean, etc. — used to catch TMDB items
// incorrectly tagged as 'en'/'es' but with non-Latin original titles.
function hasNonLatinScript(str: string): boolean {
  for (const char of str) {
    const cp = char.codePointAt(0) ?? 0
    if (cp > 0x024F && (cp < 0x2000 || cp > 0x206F)) return true
  }
  return false
}

export function applyClientFilters(results: TMDBSeries[], filters: SeriesFilters): SeriesRow[] {
  let items = results
    .filter((s) => s.first_air_date && s.name)
    .filter((s) => ALLOWED_ORIGINAL_LANGUAGES.has(s.original_language))
    .filter((s) => !hasNonLatinScript(s.original_name ?? ''))
  // vote_average_gte not supported by /search/tv
  if (filters.title && filters.vote_average_gte) {
    items = items.filter((s) => s.vote_average >= (filters.vote_average_gte ?? 0))
  }
  return items as SeriesRow[]
}

export function useSeries(filters: SeriesFilters, sortBy?: string) {
  const { language } = useLanguageStore()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery<FetchResult>({
    queryKey: ['series', page, language, filters, sortBy],
    queryFn: () =>
      fetchSeries(page, language, filters, sortBy).then((raw) => ({
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
