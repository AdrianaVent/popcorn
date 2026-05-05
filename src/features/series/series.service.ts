import { seriesService } from '@/services/tmdb'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { WATCH_PROVIDERS_REGION } from '@/config/constants'
import { deduplicateProviders } from '@/utils/watchProviders'
import type { SeriesFilters } from '@/types/series'
import type { TMDBPagedResponse, TMDBSeries, TMDBSeriesDetail, TMDBSeasonDetail, WatchProvider, WatchProvidersResult } from '@/types/tmdb'

export function fetchSeries(
  page = 1,
  language = 'es',
  filters?: SeriesFilters,
): Promise<TMDBPagedResponse<TMDBSeries>> {
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'

  if (filters?.title) {
    return seriesService.search(filters.title, page, tmdbLang)
  }

  const params: Record<string, string | number> = {
    with_original_language: 'en|es',
  }
  if (filters?.vote_average_gte) params['vote_average.gte'] = filters.vote_average_gte
  if (filters?.first_air_year)   params['first_air_date_year'] = filters.first_air_year
  if (filters?.status)           params['with_status'] = Number(filters.status)
  if (filters?.provider_id) {
    params['with_watch_providers'] = filters.provider_id
    params['watch_region'] = WATCH_PROVIDERS_REGION
  }

  return seriesService.discover(page, tmdbLang, params)
}

export function fetchSeriesDetail(id: number, language = 'es'): Promise<TMDBSeriesDetail> {
  return seriesService.detail(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}

export function fetchSeasonDetail(seriesId: number, seasonNumber: number, language = 'es'): Promise<TMDBSeasonDetail> {
  return seriesService.seasonDetail(seriesId, seasonNumber, TMDB_LANGUAGE[language] ?? 'es-ES')
}

export function fetchSeriesWatchProviders(id: number): Promise<WatchProvidersResult> {
  return seriesService.watchProviders(id)
}

export async function fetchSeriesWatchProviderOptions(): Promise<WatchProvider[]> {
  const r = await seriesService.watchProviderOptions(WATCH_PROVIDERS_REGION)
  return deduplicateProviders(r.results.sort((a, b) => a.display_priority - b.display_priority)).slice(0, 10)
}
