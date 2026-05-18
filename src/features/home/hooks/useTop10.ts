import { useQuery } from '@tanstack/react-query'
import { moviesService } from '@/services/tmdb/movies'
import { seriesService } from '@/services/tmdb/series'
import type { StoredMovie, StoredSeries, EpisodeData } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'

export type Top10Item = {
  id: number
  title: string
  posterPath: string | null
  personalRating: Rating | null
  tmdbScore: number
}

export function useGlobalMovieTop10(tmdbLang: string) {
  return useQuery<Top10Item[]>({
    queryKey: ['global-movie-top10', tmdbLang],
    queryFn: async () => {
      const page = await moviesService.topRated(1, tmdbLang)
      return page.results.slice(0, 10).map((m) => ({
        id: m.id,
        title: m.title,
        posterPath: m.poster_path,
        personalRating: null,
        tmdbScore: m.vote_average,
      }))
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useGlobalSeriesTop10(tmdbLang: string) {
  return useQuery<Top10Item[]>({
    queryKey: ['global-series-top10', tmdbLang],
    queryFn: async () => {
      const page = await seriesService.topRated(1, tmdbLang)
      return page.results.slice(0, 10).map((s) => ({
        id: s.id,
        title: s.name,
        posterPath: s.poster_path,
        personalRating: null,
        tmdbScore: s.vote_average,
      }))
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function buildUserMovieTop10(
  watchedMovies: Record<number, StoredMovie> | undefined,
  userRatings: Record<number, Rating> | undefined,
): Top10Item[] {
  return Object.values(watchedMovies ?? {})
    .map((m) => ({
      id: m.id,
      title: m.title,
      posterPath: m.poster_path,
      personalRating: userRatings?.[m.id] ?? null,
      tmdbScore: m.vote_average,
    }))
    .sort((a, b) => {
      const ra = a.personalRating ?? -1
      const rb = b.personalRating ?? -1
      if (ra !== rb) return rb - ra
      return b.tmdbScore - a.tmdbScore
    })
    .slice(0, 10)
}

export function buildUserSeriesTop10(
  watchedSeries: Record<number, StoredSeries> | undefined,
  watchedEpisodes: Record<number, Record<number, EpisodeData>> | undefined,
  userRatings: Record<number, Rating> | undefined,
): Top10Item[] {
  return Object.values(watchedSeries ?? {})
    .filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0)
    .map((s) => ({
      id: s.id,
      title: s.name,
      posterPath: s.poster_path,
      personalRating: userRatings?.[s.id] ?? null,
      tmdbScore: s.vote_average,
    }))
    .sort((a, b) => {
      const ra = a.personalRating ?? -1
      const rb = b.personalRating ?? -1
      if (ra !== rb) return rb - ra
      return b.tmdbScore - a.tmdbScore
    })
    .slice(0, 10)
}
