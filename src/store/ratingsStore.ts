import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'

// Rating values: 0.5–5 in 0.5 increments (half-star precision)
export type Rating = 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5

type UserRatings = {
  movies: Record<number, Rating>
  series: Record<number, Rating>
}
type RatingsMap = Record<string, UserRatings>

export interface RatingsState {
  ratings: RatingsMap
  setRating: (userId: string, type: 'movie' | 'series', id: number, rating: Rating) => void
  removeRating: (userId: string, type: 'movie' | 'series', id: number) => void
}

export const useRatingsStore = create<RatingsState>()(
  persist(
    (set) => ({
      ratings: {},

      setRating: (userId, type, id, rating) =>
        set((s) => {
          const user = s.ratings[userId] ?? { movies: {}, series: {} }
          const key = type === 'movie' ? 'movies' : 'series'
          return {
            ratings: {
              ...s.ratings,
              [userId]: { ...user, [key]: { ...user[key], [id]: rating } },
            },
          }
        }),

      removeRating: (userId, type, id) =>
        set((s) => {
          const user = s.ratings[userId]
          if (!user) return s
          const key = type === 'movie' ? 'movies' : 'series'
          const updated = { ...user[key] }
          delete updated[id]
          return {
            ratings: {
              ...s.ratings,
              [userId]: { ...user, [key]: updated },
            },
          }
        }),
    }),
    { name: 'popcorn-ratings-v1', storage: ssrStorage }
  )
)
