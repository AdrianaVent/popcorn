import { tmdbFetch } from './client'
import { DEFAULT_LANGUAGE } from '@/config/constants'
import type { ReleaseDatesResult, TMDBCollectionDetail, TMDBMovie, TMDBMovieDetail, TMDBPagedResponse, TMDBVideosResult, WatchProvider, WatchProvidersResult } from '@/types/tmdb'

export const moviesService = {
  detail: (id: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBMovieDetail>(`/movie/${id}`, { language }),

  search: (query: string, page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>('/search/movie', {
      query,
      page,
      language,
      include_adult: false,
    }),

  discover: (page = 1, language = DEFAULT_LANGUAGE, params: Record<string, string | number> = {}) =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>('/discover/movie', {
      sort_by: 'popularity.desc',
      page,
      language,
      ...params,
    }),

  collection: (id: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBCollectionDetail>(`/collection/${id}`, { language }),

  watchProviders: (id: number) =>
    tmdbFetch<WatchProvidersResult>(`/movie/${id}/watch/providers`),

  watchProviderOptions: (region: string) =>
    tmdbFetch<{ results: WatchProvider[] }>('/watch/providers/movie', { watch_region: region, language: 'en-US' }),

  topRated: (page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBMovie>>('/movie/top_rated', { page, language }),

  releaseDates: (id: number) =>
    tmdbFetch<ReleaseDatesResult>(`/movie/${id}/release_dates`),

  videos: (id: number) =>
    tmdbFetch<TMDBVideosResult>(`/movie/${id}/videos`, { include_video_language: 'es,en,null' }),
}
