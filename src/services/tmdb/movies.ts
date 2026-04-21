import { tmdbFetch } from './client'
import { DEFAULT_LANGUAGE } from '@/config/constants'
import type { TMDBMovie, TMDBPagedResponse } from '@/types/tmdb'

export const moviesService = {
  popular: (page = 1) =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>('/movie/popular', { page }),

  topRated: (page = 1) =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>('/movie/top_rated', { page }),

  trending: (timeWindow: 'day' | 'week' = 'week') =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`),

  detail: (id: number) =>
    tmdbFetch<TMDBMovie>(`/movie/${id}`),

  search: (query: string, page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>('/search/movie', {
      query,
      page,
      language,
      include_adult: false,
    }),
}
