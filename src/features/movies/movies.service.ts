import { moviesService } from '@/services/tmdb'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { WATCH_PROVIDERS_REGION } from '@/config/constants'
import { deduplicateProviders } from '@/utils/watchProviders'
import type { MovieFilters } from '@/types/movie'
import type { TMDBCollectionDetail, TMDBPagedResponse, TMDBMovie, TMDBMovieDetail, WatchProvider, WatchProvidersResult } from '@/types/tmdb'

export function fetchMovies(
  page = 1,
  language = 'es',
  filters?: MovieFilters
): Promise<TMDBPagedResponse<TMDBMovie>> {
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'

  if (filters?.title) {
    // Use search endpoint so pagination reflects real title matches
    // release_year is supported by /search/movie; vote_average_gte is applied client-side
    return moviesService.search(filters.title, page, tmdbLang)
  }

  const params: Record<string, string | number> = {
    with_original_language: 'en|es',
  }
  if (filters?.vote_average_gte) params['vote_average.gte'] = filters.vote_average_gte
  if (filters?.release_year)     params['primary_release_year'] = filters.release_year
  if (filters?.provider_id) {
    params['with_watch_providers'] = filters.provider_id
    params['watch_region'] = WATCH_PROVIDERS_REGION
  }
  return moviesService.discover(page, tmdbLang, params)
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

export async function fetchMovieWatchProviderOptions(): Promise<WatchProvider[]> {
  const r = await moviesService.watchProviderOptions(WATCH_PROVIDERS_REGION)
  return deduplicateProviders(r.results.sort((a, b) => a.display_priority - b.display_priority)).slice(0, 10)
}
