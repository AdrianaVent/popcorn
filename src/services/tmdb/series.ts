import { tmdbFetch } from './client'
import { DEFAULT_LANGUAGE } from '@/config/constants'
import type { TMDBSeries, TMDBPagedResponse } from '@/types/tmdb'

export const seriesService = {
  popular: (page = 1) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/tv/popular', { page }),

  topRated: (page = 1) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/tv/top_rated', { page }),

  trending: (timeWindow: 'day' | 'week' = 'week') =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>(`/trending/tv/${timeWindow}`),

  detail: (id: number) =>
    tmdbFetch<TMDBSeries>(`/tv/${id}`),

  search: (query: string, page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/search/tv', {
      query,
      page,
      language,
      include_adult: false,
    }),
}
