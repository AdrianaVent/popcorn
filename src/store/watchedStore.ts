import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'
import { useWatchlistStore } from './watchlistStore'

// Minimal snapshots stored at mark-time so the "watched" filter can render rows
// without any TMDB call. Only the fields needed for the table/modal are kept.
export type StoredMovie = {
  id: number
  title: string
  release_date: string
  vote_average: number
  vote_count: number
  poster_path: string | null
  original_language: string
  collection_id?: number
  collection_name?: string
  genre_ids?: number[]
  watchedAt?: number
}

export type StoredSeries = {
  id: number
  name: string
  first_air_date: string
  vote_average: number
  vote_count: number
  poster_path: string | null
  original_language: string
  number_of_episodes: number
  genre_ids?: number[]
  watchedAt?: number
}

// seasonNumber is stored per episode so per-season watched counts can be derived
// without fetching the full episode list from TMDB on every render.
// Shape: userId -> seriesId -> episodeId -> { seasonNumber }
export type EpisodeData = { seasonNumber: number }
type EpisodesMap = Record<string, Record<number, Record<number, EpisodeData>>>
type MoviesMap   = Record<string, Record<number, StoredMovie>>
type SeriesMap   = Record<string, Record<number, StoredSeries>>

interface WatchedState {
  episodes:   EpisodesMap
  movies:     MoviesMap
  seriesData: SeriesMap
  toggleMovie:          (userId: string, movie: StoredMovie) => void
  enrichMovie:          (userId: string, movieId: number, patch: Partial<StoredMovie>) => void
  toggleEpisode:        (userId: string, seriesId: number, episodeId: number, seasonNumber: number, series?: StoredSeries) => void
  markSeason:           (userId: string, seriesId: number, seasonNumber: number, episodeIds: number[], series?: StoredSeries) => void
  purgeUpcomingMovies:  (userId: string) => void
  purgeUpcomingSeries:  (userId: string) => void
}

export const useWatchedStore = create<WatchedState>()(
  persist(
    (set) => ({
      episodes:   {},
      movies:     {},
      seriesData: {},

      toggleMovie: (userId, movie) => {
        const adding = !useWatchedStore.getState().movies[userId]?.[movie.id]
        set((s) => {
          const userMovies = { ...s.movies[userId] }
          if (userMovies[movie.id]) {
            delete userMovies[movie.id]
          } else {
            userMovies[movie.id] = { ...movie, watchedAt: Date.now() }
          }
          return { movies: { ...s.movies, [userId]: userMovies } }
        })
        if (adding) useWatchlistStore.getState().removeMovie(userId, movie.id)
      },

      enrichMovie: (userId, movieId, patch) =>
        set((s) => {
          const userMovies = s.movies[userId]
          if (!userMovies?.[movieId]) return s
          return {
            movies: {
              ...s.movies,
              [userId]: { ...userMovies, [movieId]: { ...userMovies[movieId], ...patch } },
            },
          }
        }),

      toggleEpisode: (userId, seriesId, episodeId, seasonNumber, series) => {
        const prevEps = useWatchedStore.getState().episodes[userId]?.[seriesId] ?? {}
        const adding = !prevEps[episodeId]
        const isFirstForSeries = adding && Object.keys(prevEps).length === 0
        set((s) => {
          const userEps    = { ...s.episodes[userId] }
          const seriesEps  = { ...userEps[seriesId] }
          if (seriesEps[episodeId]) {
            delete seriesEps[episodeId]
          } else {
            seriesEps[episodeId] = { seasonNumber }
          }
          userEps[seriesId] = seriesEps

          const userSeries = { ...s.seriesData[userId] }
          if (series && !userSeries[seriesId]) {
            // Series snapshot is only written on the first episode mark to avoid
            // overwriting with stale data if the series details change later.
            userSeries[seriesId] = { ...series, watchedAt: Date.now() }
          } else if (Object.keys(seriesEps).length === 0) {
            delete userSeries[seriesId]
          }

          return {
            episodes:   { ...s.episodes,   [userId]: userEps },
            seriesData: { ...s.seriesData, [userId]: userSeries },
          }
        })
        if (isFirstForSeries) useWatchlistStore.getState().removeSeries(userId, seriesId)
      },

      purgeUpcomingMovies: (userId) => {
        const today = new Date().toISOString().slice(0, 10)
        set((s) => {
          const userMovies = s.movies[userId]
          if (!userMovies) return s
          const next = { ...userMovies }
          let changed = false
          Object.values(next).forEach((movie) => {
            if (movie.release_date && movie.release_date > today) {
              delete next[movie.id]
              changed = true
            }
          })
          if (!changed) return s
          return { movies: { ...s.movies, [userId]: next } }
        })
      },

      purgeUpcomingSeries: (userId) => {
        const today = new Date().toISOString().slice(0, 10)
        set((s) => {
          const userSeries = s.seriesData[userId]
          if (!userSeries) return s
          const futureIds = Object.values(userSeries)
            .filter((series) => series.first_air_date && series.first_air_date > today)
            .map((series) => series.id)
          if (futureIds.length === 0) return s
          const nextSeries = { ...userSeries }
          const nextEpisodes = { ...s.episodes[userId] }
          futureIds.forEach((id) => {
            delete nextSeries[id]
            delete nextEpisodes[id]
          })
          return {
            seriesData: { ...s.seriesData, [userId]: nextSeries },
            episodes:   { ...s.episodes,   [userId]: nextEpisodes },
          }
        })
      },

      markSeason: (userId, seriesId, seasonNumber, episodeIds, series) => {
        const st = useWatchedStore.getState()
        const prevSeriesEps = st.episodes[userId]?.[seriesId] ?? {}
        const allWatched = episodeIds.length > 0 && episodeIds.every((id) => !!prevSeriesEps[id])
        const hasSeriesData = !!st.seriesData[userId]?.[seriesId]
        set((s) => {
          const userEps   = { ...s.episodes[userId] }
          const seriesEps = { ...userEps[seriesId] }

          if (allWatched) {
            episodeIds.forEach((id) => { delete seriesEps[id] })
          } else {
            episodeIds.forEach((id) => { seriesEps[id] = { seasonNumber } })
          }
          userEps[seriesId] = seriesEps

          const userSeries = { ...s.seriesData[userId] }
          if (series && !userSeries[seriesId] && !allWatched) {
            userSeries[seriesId] = { ...series, watchedAt: Date.now() }
          } else if (allWatched && Object.keys(seriesEps).length === 0) {
            delete userSeries[seriesId]
          }

          return {
            episodes:   { ...s.episodes,   [userId]: userEps },
            seriesData: { ...s.seriesData, [userId]: userSeries },
          }
        })
        if (!allWatched && !hasSeriesData) useWatchlistStore.getState().removeSeries(userId, seriesId)
      },
    }),
    { name: 'popcorn-watched-v3', storage: ssrStorage }
  )
)
