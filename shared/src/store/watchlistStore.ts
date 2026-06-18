import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'

export type WatchlistMovie = {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  vote_average: number
  vote_count: number
  original_language: string
  collection_id?: number
  collection_name?: string
  addedAt: number
}

export type WatchlistSeries = {
  id: number
  name: string
  first_air_date: string
  poster_path: string | null
  vote_average: number
  vote_count: number
  original_language: string
  addedAt: number
}

type WatchlistMoviesMap = Record<string, Record<number, WatchlistMovie>>
type WatchlistSeriesMap = Record<string, Record<number, WatchlistSeries>>

interface WatchlistState {
  movies: WatchlistMoviesMap
  series: WatchlistSeriesMap
  toggleMovie:  (userId: string, movie: WatchlistMovie) => void
  toggleSeries: (userId: string, series: WatchlistSeries) => void
  removeMovie:  (userId: string, movieId: number) => void
  removeSeries: (userId: string, seriesId: number) => void
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      movies: {},
      series: {},

      toggleMovie: (userId, movie) =>
        set((s) => {
          const userMovies = { ...s.movies[userId] }
          if (userMovies[movie.id]) {
            delete userMovies[movie.id]
          } else {
            userMovies[movie.id] = { ...movie, addedAt: Date.now() }
          }
          return { movies: { ...s.movies, [userId]: userMovies } }
        }),

      toggleSeries: (userId, series) =>
        set((s) => {
          const userSeries = { ...s.series[userId] }
          if (userSeries[series.id]) {
            delete userSeries[series.id]
          } else {
            userSeries[series.id] = { ...series, addedAt: Date.now() }
          }
          return { series: { ...s.series, [userId]: userSeries } }
        }),

      removeMovie: (userId, movieId) =>
        set((s) => {
          const userMovies = { ...s.movies[userId] }
          delete userMovies[movieId]
          return { movies: { ...s.movies, [userId]: userMovies } }
        }),

      removeSeries: (userId, seriesId) =>
        set((s) => {
          const userSeries = { ...s.series[userId] }
          delete userSeries[seriesId]
          return { series: { ...s.series, [userId]: userSeries } }
        }),
    }),
    { name: 'popcorn-watchlist-v1', storage: ssrStorage }
  )
)
