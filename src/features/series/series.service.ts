import { seriesService } from '@/services/tmdb'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { WATCH_PROVIDERS_REGION } from '@/config/constants'
import { fetchWatchProviderOptions } from '@/utils/watchProviders'
import { getEquivalentGenreIds } from '@/config/genres'
import type { SeriesFilters } from '@/types/series'
import type { TMDBPagedResponse, TMDBSeries, TMDBSeriesDetail, TMDBSeasonDetail, WatchProvider, WatchProvidersResult } from '@/types/tmdb'

function mergeSeriesPages(
  en: TMDBPagedResponse<TMDBSeries>,
  es: TMDBPagedResponse<TMDBSeries>,
  sortBy?: string,
): TMDBPagedResponse<TMDBSeries> {
  const seen = new Set<number>()
  const results = [...en.results, ...es.results].filter((s) => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })
  if (sortBy) {
    const [field, dir] = sortBy.split('.')
    results.sort((a, b) => {
      const av = a[field as keyof TMDBSeries] as string | number
      const bv = b[field as keyof TMDBSeries] as string | number
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })
  }
  return { results, page: en.page, total_pages: Math.max(en.total_pages, es.total_pages), total_results: en.total_results + es.total_results }
}

export function fetchSeries(
  page = 1,
  language = 'es',
  filters?: SeriesFilters,
  sortBy?: string,
): Promise<TMDBPagedResponse<TMDBSeries>> {
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'

  if (filters?.title) {
    // sort_by not supported by /search/tv — ignored in search mode
    return seriesService.search(filters.title, page, tmdbLang)
  }

  const params: Record<string, string | number> = {}
  if (sortBy)                    params['sort_by'] = sortBy
  if (filters?.vote_average_gte) params['vote_average.gte'] = filters.vote_average_gte
  if (filters?.runtime_gte)      params['with_runtime.gte'] = filters.runtime_gte
  if (filters?.first_air_year)   params['first_air_date_year'] = filters.first_air_year
  if (filters?.status)           params['with_status'] = Number(filters.status)
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
    seriesService.discover(page, tmdbLang, { ...params, with_original_language: 'en' }),
    seriesService.discover(page, tmdbLang, { ...params, with_original_language: 'es' }),
  ]).then(([en, es]) => mergeSeriesPages(en, es, sortBy))
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

export function fetchSeriesWatchProviderOptions(): Promise<WatchProvider[]> {
  return fetchWatchProviderOptions(seriesService, WATCH_PROVIDERS_REGION)
}
