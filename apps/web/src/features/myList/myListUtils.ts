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

export type MyListFilters = { title: string; genre_ids: number[]; min_rating: number }
export const INITIAL_FILTERS: MyListFilters = { title: '', genre_ids: [], min_rating: 0 }

export const formatSagaName = (name: string) =>
  name
    .replace(/\s*-?\s*Collection/gi, ' - Saga')
    .replace(/\s*-?\s*Colección/gi, ' - Saga')
    .trim()

export function groupAndSortMovies(movieList: StoredMovie[]): { sagaGroups: SagaGroup[]; standaloneMovies: StoredMovie[] } {
  const collectionMap = new Map<number, SagaGroup>()
  const standalone: StoredMovie[] = []

  movieList.forEach((movie) => {
    if (movie.collection_id && movie.collection_name) {
      const existing = collectionMap.get(movie.collection_id)
      if (existing) {
        existing.movies.push(movie)
      } else {
        collectionMap.set(movie.collection_id, { id: movie.collection_id, name: movie.collection_name, movies: [movie] })
      }
    } else {
      standalone.push(movie)
    }
  })

  const groups: SagaGroup[] = []
  collectionMap.forEach((g) => {
    g.movies.sort((a, b) => a.release_date.localeCompare(b.release_date))
    groups.push(g)
  })
  groups.sort((a, b) => {
    const aLatest = Math.max(...a.movies.map((m) => m.watchedAt ?? 0))
    const bLatest = Math.max(...b.movies.map((m) => m.watchedAt ?? 0))
    return bLatest - aLatest
  })

  return { sagaGroups: groups, standaloneMovies: standalone }
}

export function computeSagasFirst(sagaGroups: SagaGroup[], standaloneMovies: StoredMovie[]): boolean {
  const latestSaga = sagaGroups.flatMap((g) => g.movies).reduce((max, m) => Math.max(max, m.watchedAt ?? 0), 0)
  const latestStandalone = standaloneMovies.reduce((max, m) => Math.max(max, m.watchedAt ?? 0), 0)
  return latestSaga >= latestStandalone
}

export function groupWatchlistMovies(movieList: WatchlistMovie[]): { sagaGroups: WatchlistSagaGroup[]; standaloneMovies: WatchlistMovie[] } {
  const collectionMap = new Map<number, WatchlistSagaGroup>()
  const standalone: WatchlistMovie[] = []

  movieList.forEach((movie) => {
    if (movie.collection_id && movie.collection_name) {
      const existing = collectionMap.get(movie.collection_id)
      if (existing) {
        existing.movies.push(movie)
      } else {
        collectionMap.set(movie.collection_id, { id: movie.collection_id, name: movie.collection_name, movies: [movie] })
      }
    } else {
      standalone.push(movie)
    }
  })

  const groups: WatchlistSagaGroup[] = []
  collectionMap.forEach((g) => {
    g.movies.sort((a, b) => a.release_date.localeCompare(b.release_date))
    groups.push(g)
  })
  groups.sort((a, b) => Math.max(...b.movies.map((m) => m.addedAt)) - Math.max(...a.movies.map((m) => m.addedAt)))

  return { sagaGroups: groups, standaloneMovies: standalone }
}

// Saga card pixel width: px-3 padding (24px) + N × w-24 (96px) + (N-1) × gap-3 (12px) = 108N + 12
const SAGA_PX = (n: number) => 108 * n + 12
const SAGA_GAP = 16

// First saga stays at position 0; the rest fill the first available slot in any row (bin packing).
// displayedCounts[i] reflects the actual rendered movies per saga (watched + unreleased placeholders).
export function binPackSagas(groups: SagaGroup[], displayedCounts: number[], containerPx: number): SagaGroup[][] {
  if (groups.length === 0) return []
  const rows: SagaGroup[][] = [[groups[0]]]
  const used = [SAGA_PX(displayedCounts[0] ?? groups[0].movies.length)]
  for (let idx = 1; idx < groups.length; idx++) {
    const group = groups[idx]
    const w = SAGA_PX(displayedCounts[idx] ?? group.movies.length)
    let placed = false
    for (let i = 0; i < rows.length; i++) {
      if (used[i] + SAGA_GAP + w <= containerPx) {
        rows[i].push(group)
        used[i] += SAGA_GAP + w
        placed = true
        break
      }
    }
    if (!placed) { rows.push([group]); used.push(w) }
  }
  return rows
}
