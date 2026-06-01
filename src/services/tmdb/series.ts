import { tmdbFetch } from './client'
import { DEFAULT_LANGUAGE } from '@/config/constants'
import type { TMDBSeries, TMDBSeriesDetail, TMDBSeasonDetail, TMDBPagedResponse, TMDBVideosResult, WatchProvider, WatchProvidersResult } from '@/types/tmdb'

export const seriesService = {
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

  watchProviders: (id: number) =>
    tmdbFetch<WatchProvidersResult>(`/tv/${id}/watch/providers`),

  topRated: (page = 1, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>('/tv/top_rated', { page, language }),

  watchProviderOptions: (region: string) =>
    tmdbFetch<{ results: WatchProvider[] }>('/watch/providers/tv', { watch_region: region, language: 'en-US' }),

  videos: (id: number) =>
    tmdbFetch<TMDBVideosResult>(`/tv/${id}/videos`, { include_video_language: 'es,en,null' }),

  seasonVideos: (seriesId: number, seasonNumber: number) =>
    tmdbFetch<TMDBVideosResult>(`/tv/${seriesId}/season/${seasonNumber}/videos`, { include_video_language: 'es,en,null' }),

  recommendations: (id: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPagedResponse<TMDBSeries>>(`/tv/${id}/recommendations`, { language }),
}
