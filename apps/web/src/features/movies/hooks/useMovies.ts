'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMovies } from '@/features/movies/movies.service'
import { useLanguageStore } from '@/store/languageStore'
import { ALLOWED_ORIGINAL_LANGUAGES } from '@/config/constants'
import { getEquivalentGenreIds } from '@/config/genres'
import type { MovieFilters, MovieRow } from '@/types/movie'
import type { TMDBMovie } from '@/types/tmdb'

type FetchResult = { movies: MovieRow[]; totalPages: number }

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

export function applyClientFilters(results: TMDBMovie[], filters: MovieFilters): MovieRow[] {
  let items = results
    .filter((m) => m.release_date && m.title)
    .filter((m) => ALLOWED_ORIGINAL_LANGUAGES.has(m.original_language))
    .filter((m) => !hasNonLatinScript(m.original_title ?? ''))
  // vote_average_gte not supported by /search/movie
  if (filters.title && filters.vote_average_gte) {
    items = items.filter((m) => m.vote_average >= (filters.vote_average_gte ?? 0))
  }
  if (filters.genre_ids?.length) {
    const allowed = new Set(filters.genre_ids.flatMap(getEquivalentGenreIds))
    items = items.filter((m) => m.genre_ids?.some((gid) => allowed.has(gid)))
  }
  return items as MovieRow[]
}

export function useMovies(filters: MovieFilters, sortBy?: string) {
  const { language } = useLanguageStore()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery<FetchResult>({
    queryKey: ['movies', page, language, filters, sortBy],
    queryFn: () =>
      fetchMovies(page, language, filters, sortBy).then((raw) => ({
        movies: applyClientFilters(raw.results ?? [], filters),
        totalPages: raw.total_pages ?? 1,
      })),
    enabled: filters.watched !== 'watched',
  })

  return {
    movies: data?.movies ?? [],
    totalPages: data?.totalPages ?? 1,
    loading: isLoading,
    error: isError ? 'TMDB_FETCH_ERROR' : null,
    page,
    goToPage: setPage,
    retry: refetch,
  }
}
