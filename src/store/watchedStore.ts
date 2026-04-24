import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Minimal snapshots stored at mark-time so the "watched" filter can show them without TMDB
export type StoredMovie = {
  id: number
  title: string
  release_date: string
  vote_average: number
  vote_count: number
  poster_path: string | null
  original_language: string
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

// episodes: userId -> seriesId -> episodeId -> { seasonNumber }
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
          // Update episode
          const userEps    = { ...s.episodes[userId] }
          const seriesEps  = { ...userEps[seriesId] }
          if (seriesEps[episodeId]) {
            delete seriesEps[episodeId]
          } else {
            seriesEps[episodeId] = { seasonNumber }
          }
          userEps[seriesId] = seriesEps

          // Store series snapshot on first mark (or update if provided)
          const userSeries = { ...s.seriesData[userId] }
          if (series && !userSeries[seriesId]) {
            userSeries[seriesId] = series
          }

          return {
            episodes:   { ...s.episodes,   [userId]: userEps },
            seriesData: { ...s.seriesData, [userId]: userSeries },
          }
        }),
    }),
    { name: 'popcorn-watched-v3' }
  )
)
