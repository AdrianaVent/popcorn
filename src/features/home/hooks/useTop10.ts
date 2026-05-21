import { useQuery } from '@tanstack/react-query'
import { moviesService } from '@/services/tmdb/movies'
import { seriesService } from '@/services/tmdb/series'
import type { StoredMovie, StoredSeries, EpisodeData } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'

export type Top10Item = {
  id: number
  title: string
  year: number | null
  posterPath: string | null
  personalRating: Rating | null
  tmdbScore: number
  genre_ids: number[]
}

export function useGlobalMovieTop10(tmdbLang: string) {
  return useQuery<Top10Item[]>({
    queryKey: ['global-movie-top10-v2', tmdbLang],
    queryFn: async () => {
      const page = await moviesService.topRated(1, tmdbLang)
      return page.results.slice(0, 10).map((m) => ({
        id: m.id,
        title: m.title,
        year: m.release_date ? new Date(m.release_date).getFullYear() : null,
        posterPath: m.poster_path,
        personalRating: null,
        tmdbScore: m.vote_average,
        genre_ids: m.genre_ids,
      }))
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useGlobalSeriesTop10(tmdbLang: string) {
  return useQuery<Top10Item[]>({
    queryKey: ['global-series-top10-v2', tmdbLang],
    queryFn: async () => {
      const page = await seriesService.topRated(1, tmdbLang)
      return page.results.slice(0, 10).map((s) => ({
        id: s.id,
        title: s.name,
        year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
        posterPath: s.poster_path,
        personalRating: null,
        tmdbScore: s.vote_average,
        genre_ids: s.genre_ids,
      }))
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useGlobalMovieTop10ByGenre(tmdbLang: string, genreId: number | null) {
  return useQuery<Top10Item[]>({
    queryKey: ['global-movie-top10-genre', tmdbLang, genreId],
    queryFn: async () => {
      const page = await moviesService.discover(1, tmdbLang, {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 200,
        with_genres: String(genreId),
      })
      return page.results.slice(0, 10).map((m) => ({
        id: m.id,
        title: m.title,
        year: m.release_date ? new Date(m.release_date).getFullYear() : null,
        posterPath: m.poster_path,
        personalRating: null,
        tmdbScore: m.vote_average,
        genre_ids: m.genre_ids,
      }))
    },
    enabled: genreId !== null,
    staleTime: 10 * 60 * 1000,
  })
}

export function useGlobalSeriesTop10ByGenre(tmdbLang: string, genreId: number | null) {
  return useQuery<Top10Item[]>({
    queryKey: ['global-series-top10-genre', tmdbLang, genreId],
    queryFn: async () => {
      const page = await seriesService.discover(1, tmdbLang, {
        sort_by: 'vote_average.desc',
        'vote_count.gte': 200,
        with_genres: String(genreId),
      })
      return page.results.slice(0, 10).map((s) => ({
        id: s.id,
        title: s.name,
        year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
        posterPath: s.poster_path,
        personalRating: null,
        tmdbScore: s.vote_average,
        genre_ids: s.genre_ids,
      }))
    },
    enabled: genreId !== null,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUserMovieTop10ByGenre(
  pool: Top10Item[],
  genreId: number | null,
  tmdbLang: string,
) {
  return useQuery<Top10Item[]>({
    queryKey: ['user-movie-top10-genre', pool.map((i) => i.id).sort(), genreId, tmdbLang],
    queryFn: async () => {
      const enriched = await Promise.all(
        pool.map(async (item) => {
          if ((item.genre_ids ?? []).length > 0) return item
          const detail = await moviesService.detail(item.id, tmdbLang)
          return { ...item, genre_ids: detail.genres.map((g) => g.id) }
        })
      )
      return sortByRatingDesc(enriched.filter((item) => item.genre_ids.includes(genreId!))).slice(0, 10)
    },
    enabled: genreId !== null && pool.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserSeriesTop10ByGenre(
  pool: Top10Item[],
  genreId: number | null,
  tmdbLang: string,
) {
  return useQuery<Top10Item[]>({
    queryKey: ['user-series-top10-genre', pool.map((i) => i.id).sort(), genreId, tmdbLang],
    queryFn: async () => {
      const enriched = await Promise.all(
        pool.map(async (item) => {
          if ((item.genre_ids ?? []).length > 0) return item
          const detail = await seriesService.detail(item.id, tmdbLang)
          return { ...item, genre_ids: detail.genres.map((g) => g.id) }
        })
      )
      return sortByRatingDesc(enriched.filter((item) => item.genre_ids.includes(genreId!))).slice(0, 10)
    },
    enabled: genreId !== null && pool.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserMovieTop10(pool: Top10Item[], tmdbLang: string) {
  return useQuery<Top10Item[]>({
    queryKey: ['user-movie-top10-enriched', pool.map((i) => i.id).sort(), tmdbLang],
    queryFn: async () =>
      Promise.all(
        pool.slice(0, 10).map(async (item) => {
          if (item.genre_ids.length > 0) return item
          const detail = await moviesService.detail(item.id, tmdbLang)
          return { ...item, genre_ids: detail.genres.map((g) => g.id) }
        })
      ),
    enabled: pool.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserSeriesTop10(pool: Top10Item[], tmdbLang: string) {
  return useQuery<Top10Item[]>({
    queryKey: ['user-series-top10-enriched', pool.map((i) => i.id).sort(), tmdbLang],
    queryFn: async () =>
      Promise.all(
        pool.slice(0, 10).map(async (item) => {
          if (item.genre_ids.length > 0) return item
          const detail = await seriesService.detail(item.id, tmdbLang)
          return { ...item, genre_ids: detail.genres.map((g) => g.id) }
        })
      ),
    enabled: pool.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

function sortByRatingDesc(items: Top10Item[]): Top10Item[] {
  return items.sort((a, b) => {
    const ra = a.personalRating ?? -1
    const rb = b.personalRating ?? -1
    if (ra !== rb) return rb - ra
    return b.tmdbScore - a.tmdbScore
  })
}

export function buildUserMoviePool(
  watchedMovies: Record<number, StoredMovie> | undefined,
  userRatings: Record<number, Rating> | undefined,
): Top10Item[] {
  return sortByRatingDesc(
    Object.values(watchedMovies ?? {}).map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? new Date(m.release_date).getFullYear() : null,
      posterPath: m.poster_path,
      personalRating: userRatings?.[m.id] ?? null,
      tmdbScore: m.vote_average,
      genre_ids: m.genre_ids ?? [],
    }))
  )
}

export function buildUserSeriesPool(
  watchedSeries: Record<number, StoredSeries> | undefined,
  watchedEpisodes: Record<number, Record<number, EpisodeData>> | undefined,
  userRatings: Record<number, Rating> | undefined,
): Top10Item[] {
  return sortByRatingDesc(
    Object.values(watchedSeries ?? {})
      .filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0)
      .map((s) => ({
        id: s.id,
        title: s.name,
        year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : null,
        posterPath: s.poster_path,
        personalRating: userRatings?.[s.id] ?? null,
        tmdbScore: s.vote_average,
        genre_ids: s.genre_ids ?? [],
      }))
  )
}
