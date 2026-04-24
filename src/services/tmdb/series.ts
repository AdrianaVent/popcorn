import { tmdbFetch } from './client'
import { DEFAULT_LANGUAGE } from '@/config/constants'
import type { TMDBSeries, TMDBSeriesDetail, TMDBSeasonDetail, TMDBPagedResponse } from '@/types/tmdb'

export const seriesService = {
  popular: (page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/tv/popular', { page, language }),

  topRated: (page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/tv/top_rated', { page, language }),

  trending: (timeWindow: 'day' | 'week' = 'week') =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>(`/trending/tv/${timeWindow}`),

  detail: (id: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBSeriesDetail>(`/tv/${id}`, { language }),

  search: (query: string, page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/search/tv', {
      query,
      page,
      language,
      include_adult: false,
    }),

  discover: (page = 1, language = DEFAULT_LANGUAGE, params: Record<string, string | number> = {}) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/discover/tv', {
      sort_by: 'popularity.desc',
      page,
      language,
      ...params,
    }),

  seasonDetail: (seriesId: number, seasonNumber: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`, { language }),
}
