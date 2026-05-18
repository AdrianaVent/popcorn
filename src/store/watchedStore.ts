import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'

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
  toggleMovie:   (userId: string, movie: StoredMovie) => void
  toggleEpisode: (userId: string, seriesId: number, episodeId: number, seasonNumber: number, series?: StoredSeries) => void
  markSeason:    (userId: string, seriesId: number, seasonNumber: number, episodeIds: number[], series?: StoredSeries) => void
}

export const useWatchedStore = create<WatchedState>()(
  persist(
    (set) => ({
      episodes:   {},
      movies:     {},
      seriesData: {},

      toggleMovie: (userId, movie) =>
        set((s) => {
          const userMovies = { ...s.movies[userId] }
          if (userMovies[movie.id]) {
            delete userMovies[movie.id]
          } else {
            userMovies[movie.id] = movie
          }
          return { movies: { ...s.movies, [userId]: userMovies } }
        }),

      toggleEpisode: (userId, seriesId, episodeId, seasonNumber, series) =>
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
            userSeries[seriesId] = series
          } else if (Object.keys(seriesEps).length === 0) {
            delete userSeries[seriesId]
          }

          return {
            episodes:   { ...s.episodes,   [userId]: userEps },
            seriesData: { ...s.seriesData, [userId]: userSeries },
          }
        }),

      markSeason: (userId, seriesId, seasonNumber, episodeIds, series) =>
        set((s) => {
          const userEps   = { ...s.episodes[userId] }
          const seriesEps = { ...userEps[seriesId] }

          const allWatched = episodeIds.length > 0 && episodeIds.every((id) => !!seriesEps[id])
          if (allWatched) {
            episodeIds.forEach((id) => { delete seriesEps[id] })
          } else {
            episodeIds.forEach((id) => { seriesEps[id] = { seasonNumber } })
          }
          userEps[seriesId] = seriesEps

          const userSeries = { ...s.seriesData[userId] }
          if (series && !userSeries[seriesId] && !allWatched) {
            userSeries[seriesId] = series
          } else if (allWatched && Object.keys(seriesEps).length === 0) {
            delete userSeries[seriesId]
          }

          return {
            episodes:   { ...s.episodes,   [userId]: userEps },
            seriesData: { ...s.seriesData, [userId]: userSeries },
          }
        }),
    }),
    { name: 'popcorn-watched-v3', storage: ssrStorage }
  )
)
