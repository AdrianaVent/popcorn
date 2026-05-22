import { moviesService } from '@/services/tmdb'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { WATCH_PROVIDERS_REGION } from '@/config/constants'
import { fetchWatchProviderOptions } from '@/utils/watchProviders'
import { getEquivalentGenreIds } from '@/config/genres'
import type { MovieFilters } from '@/types/movie'
import type { TMDBCollectionDetail, TMDBPagedResponse, TMDBMovie, TMDBMovieDetail, TMDBVideosResult, WatchProvider, WatchProvidersResult } from '@/types/tmdb'

// TMDB sort_by field name → actual field in TMDBMovie response
const SORT_FIELD: Partial<Record<string, keyof TMDBMovie>> = {
  primary_release_date: 'release_date',
}

function mergeMoviePages(
  en: TMDBPagedResponse<TMDBMovie>,
  es: TMDBPagedResponse<TMDBMovie>,
  sortBy?: string,
): TMDBPagedResponse<TMDBMovie> {
  const seen = new Set<number>()
  const results = [...en.results, ...es.results].filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
  if (sortBy) {
    const [tmdbField, dir] = sortBy.split('.')
    const field = (SORT_FIELD[tmdbField] ?? tmdbField) as keyof TMDBMovie
    results.sort((a, b) => {
      const av = a[field] as string | number
      const bv = b[field] as string | number
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })
  }
  return { results, page: en.page, total_pages: Math.max(en.total_pages, es.total_pages), total_results: en.total_results + es.total_results }
}

export function fetchMovies(
  page = 1,
  language = 'es',
  filters?: MovieFilters,
  sortBy?: string,
): Promise<TMDBPagedResponse<TMDBMovie>> {
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'

  if (filters?.title) {
    // Use search endpoint so pagination reflects real title matches
    // release_year is supported by /search/movie; vote_average_gte is applied client-side
    // sort_by is not supported by /search/movie — ignored in search mode
    return moviesService.search(filters.title, page, tmdbLang)
  }

  const params: Record<string, string | number> = {}
  if (sortBy)                    params['sort_by'] = sortBy
  if (filters?.vote_average_gte) params['vote_average.gte'] = filters.vote_average_gte
  if (filters?.release_year)     params['primary_release_year'] = filters.release_year
  if (filters?.runtime_gte)      params['with_runtime.gte'] = filters.runtime_gte
  if (filters?.provider_id) {
    params['with_watch_providers'] = filters.provider_id
    params['watch_region'] = WATCH_PROVIDERS_REGION
  }
  if (filters?.genre_ids?.length) {
    const ids = [...new Set(filters.genre_ids.flatMap(getEquivalentGenreIds))]
    params['with_genres'] = ids.join('|')
  }

  // TMDB only supports a single value for with_original_language — two parallel requests
  // for 'en' and 'es', then merge, so non-EN/ES titles never reach the client.
  return Promise.all([
    moviesService.discover(page, tmdbLang, { ...params, with_original_language: 'en' }),
    moviesService.discover(page, tmdbLang, { ...params, with_original_language: 'es' }),
  ]).then(([en, es]) => mergeMoviePages(en, es, sortBy))
}

export function fetchMovieDetail(id: number, language = 'es'): Promise<TMDBMovieDetail> {
  return moviesService.detail(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}

export function fetchCollectionDetail(id: number, language = 'es'): Promise<TMDBCollectionDetail> {
  return moviesService.collection(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}

export function fetchMovieWatchProviders(id: number): Promise<WatchProvidersResult> {
  return moviesService.watchProviders(id)
}

export function fetchMovieWatchProviderOptions(): Promise<WatchProvider[]> {
  return fetchWatchProviderOptions(moviesService, WATCH_PROVIDERS_REGION)
}

export function fetchMovieVideos(id: number): Promise<TMDBVideosResult> {
  return moviesService.videos(id)
}
