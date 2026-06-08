import type { StoredMovie } from '@/store/watchedStore'
import type { WatchlistMovie } from '@/store/watchlistStore'
import type { Rating } from '@/store/ratingsStore'

export const RATING_THRESHOLD: Rating = 3.5

export type SagaGroup = {
  id: number
  name: string
  movies: StoredMovie[]
}

export type WatchlistSagaGroup = {
  id: number
  name: string
  movies: WatchlistMovie[]
}

export type RecommendationSource = {
  id: number
  scrollId: number
  name: string
  posterPath: string | null
} | null

export const formatSagaName = (name: string) =>
  name
    .replace(/\s*-?\s*Collection/gi, ' - Saga')
    .replace(/\s*-?\s*Colección/gi, ' - Saga')
    .trim()
