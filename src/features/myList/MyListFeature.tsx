'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import MovieCard from '@/features/myList/components/MovieCard'
import SeriesCard from '@/features/myList/components/SeriesCard'
import RecommendationsDrawer from '@/features/myList/components/RecommendationsDrawer'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import { useWatchedStore } from '@/store/watchedStore'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import type { Rating } from '@/store/ratingsStore'
import type { StoredMovie, StoredSeries } from '@/store/watchedStore'
import type { WatchlistMovie } from '@/store/watchlistStore'
import type { TMDBCollectionPart } from '@/types/tmdb'
import PageLayout from '@/components/layouts/PageLayout'
import Tooltip from '@/components/ui/Tooltip'
import { BookmarkIcon, FilmIcon, TvIcon, HeartIcon } from '@/components/icons'
import { getTMDBImageUrl } from '@/utils/tmdb'
import WatchlistCard from '@/features/myList/components/WatchlistCard'

const RATING_THRESHOLD: Rating = 3.5

export type SagaGroup = {
  id: number
  name: string
  movies: StoredMovie[]
}

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
        collectionMap.set(movie.collection_id, {
          id: movie.collection_id,
          name: movie.collection_name,
          movies: [movie],
        })
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
  const latestSaga = sagaGroups
    .flatMap((g) => g.movies)
    .reduce((max, m) => Math.max(max, m.watchedAt ?? 0), 0)
  const latestStandalone = standaloneMovies
    .reduce((max, m) => Math.max(max, m.watchedAt ?? 0), 0)
  return latestSaga >= latestStandalone
}

type Tab = 'movies' | 'series' | 'towatch'

export type WatchlistSagaGroup = {
  id: number
  name: string
  movies: WatchlistMovie[]
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

type RecommendationSource = { id: number; scrollId: number; name: string; posterPath: string | null } | null

function UnwatchedMoviePlaceholder({ part, onClick }: { part: { id: number; title: string; poster_path: string | null }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 w-24 items-center group"
    >
      <div className="relative w-24 aspect-2/3 rounded-lg overflow-hidden bg-muted border border-dashed border-border/60 hover:border-border transition-colors">
        {part.poster_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getTMDBImageUrl(part.poster_path, 'w185') ?? undefined}
            alt={part.title}
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-border/60" />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/50 text-center truncate w-full px-0.5 leading-tight">
        {part.title}
      </p>
    </button>
  )
}

// Saga card pixel width: px-3 padding (24px) + N × w-24 (96px) + (N-1) × gap-3 (12px) = 108N + 12
const SAGA_PX = (n: number) => 108 * n + 12
const SAGA_GAP = 16 // gap-4

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

function SagaCard({
  group,
  movieRatings,
  userRatings,
  movieRecSource,
  onRate,
  onMovieClick,
  onSagaRec,
}: {
  group: SagaGroup
  movieRatings: Record<number, Rating>
  userRatings: Record<number, Rating> | undefined
  movieRecSource: RecommendationSource
  onRate: (id: number, r: Rating) => void
  onMovieClick: (id: number) => void
  onSagaRec: (movie: StoredMovie, sagaName: string, groupId: number) => void
}) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()

  const { data: collection } = useQuery({
    queryKey: ['collection-detail', group.id, language],
    queryFn: () => fetchCollectionDetail(group.id, language),
    staleTime: 24 * 60 * 60 * 1000,
  })

  // Merge full collection (all movies) with watched data; fall back to watched-only while loading
  const allMovies = useMemo(() => {
    const watchedById = new Map(group.movies.map((m) => [m.id, m]))
    if (!collection?.parts?.length) {
      return group.movies.map((m) => ({ part: null as TMDBCollectionPart | null, watched: m }))
    }
    const today = new Date().toISOString().slice(0, 10)
    return [...collection.parts]
      .filter((p) => p.release_date && p.release_date <= today)
      .sort((a, b) => a.release_date.localeCompare(b.release_date))
      .map((part) => ({ part, watched: watchedById.get(part.id) ?? null }))
  }, [collection, group.movies])

  const bestRatedMovie = useMemo(() =>
    group.movies.reduce<StoredMovie | null>((best, movie) => {
      const r = movieRatings[movie.id] ?? 0
      const bestR = best ? (movieRatings[best.id] ?? 0) : 0
      return r >= RATING_THRESHOLD && r > bestR ? movie : best
    }, null),
    [group.movies, movieRatings],
  )

  const sagaRecActive = bestRatedMovie !== null && movieRecSource?.id === bestRatedMovie.id

  return (
    <>
      <div className="flex justify-center text-center">
        <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-foreground">{formatSagaName(group.name)}</Text>
      </div>

      <div className="flex flex-wrap gap-3">
        {allMovies.map(({ part, watched }, i) =>
          watched ? (
            <MovieCard
              key={watched.id}
              movie={watched}
              rating={userRatings?.[watched.id] ?? null}
              onRate={(r) => onRate(watched.id, r)}
              onClick={() => onMovieClick(watched.id)}
              eager={i < 6}
              showRecommendations={false}
            />
          ) : (
            <UnwatchedMoviePlaceholder
              key={part!.id}
              part={part!}
              onClick={() => onMovieClick(part!.id)}
            />
          )
        )}
      </div>

      <div className="flex justify-center mt-auto pt-1">
        <Tooltip content={t('myList.recommendations.rateFirst')} disabled={!!bestRatedMovie} placement="bottom">
          <button
            onClick={bestRatedMovie ? () => onSagaRec(bestRatedMovie, formatSagaName(group.name), group.id) : undefined}
            disabled={!bestRatedMovie}
            className={`text-[11px] px-3 py-1 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed ${
              sagaRecActive
                ? 'border-primary text-primary bg-primary/10'
                : bestRatedMovie
                  ? 'border-primary/40 text-primary/80 hover:border-primary hover:bg-primary/5'
                  : 'border-border/40 text-muted-foreground/30'
            }`}
          >
            {t('myList.recommendations.similar')}
          </button>
        </Tooltip>
      </div>
    </>
  )
}

function WatchlistSagaCard({
  group,
  watchedMovies,
  watchlistMoviesMap,
  onMovieClick,
  onRemove,
}: {
  group: WatchlistSagaGroup
  watchedMovies: Record<number, StoredMovie> | undefined
  watchlistMoviesMap: Record<number, WatchlistMovie> | undefined
  onMovieClick: (id: number) => void
  onRemove: (movieId: number) => void
}) {
  const { language } = useLanguageStore()

  const { data: collection } = useQuery({
    queryKey: ['collection-detail', group.id, language],
    queryFn: () => fetchCollectionDetail(group.id, language),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const allMovies = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    type PartMin = { id: number; title: string; poster_path: string | null; release_date: string }
    const parts: PartMin[] = collection?.parts?.length ? collection.parts : group.movies
    return [...parts]
      .filter((p) => p.release_date && p.release_date <= today)
      .sort((a, b) => a.release_date.localeCompare(b.release_date))
      .map((part) => ({
        part,
        isWatched:     !!watchedMovies?.[part.id],
        isInWatchlist: !!watchlistMoviesMap?.[part.id],
      }))
  }, [collection, group.movies, watchedMovies, watchlistMoviesMap])

  return (
    <div className="rounded-xl border border-border/40 px-3 pt-3 pb-2 flex flex-col gap-2 bg-cream-100 dark:bg-gray-900">
      <div className="flex justify-center text-center">
        <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-foreground">
          {formatSagaName(group.name)}
        </Text>
      </div>
      <div className="flex flex-wrap gap-3">
        {allMovies.map(({ part, isWatched, isInWatchlist }, i) => {
          if (isWatched) {
            return (
              <button key={part.id} onClick={() => onMovieClick(part.id)} className="flex flex-col gap-2 w-24 items-center group">
                <div className="relative w-24 aspect-2/3 rounded-lg overflow-hidden">
                  {part.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getTMDBImageUrl(part.poster_path, 'w185') ?? undefined}
                      alt={part.title}
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted opacity-40" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4l3 3L9 1" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/50 text-center truncate w-full px-0.5 leading-tight">{part.title}</p>
              </button>
            )
          }
          if (isInWatchlist) {
            return (
              <WatchlistCard
                key={part.id}
                posterPath={part.poster_path}
                title={part.title}
                year={part.release_date ? new Date(part.release_date).getFullYear() : null}
                onClick={() => onMovieClick(part.id)}
                onRemove={() => onRemove(part.id)}
                eager={i < 6}
              />
            )
          }
          return (
            <UnwatchedMoviePlaceholder key={part.id} part={part} onClick={() => onMovieClick(part.id)} />
          )
        })}
      </div>
    </div>
  )
}

export default function MyListFeature() {
  const { t } = useTranslation()
  const [tab, setTab]                               = useState<Tab>('movies')
  const [selectedMovieId, setSelectedMovieId]       = useState<number | null>(null)
  const [selectedSeriesId, setSelectedSeriesId]     = useState<number | null>(null)
  const [movieRecSource, setMovieRecSource]         = useState<RecommendationSource>(null)
  const [seriesRecSource, setSeriesRecSource]       = useState<RecommendationSource>(null)
  const [sagaContainerPx, setSagaContainerPx]       = useState(1000)
  const sagaContainerRef                            = useRef<HTMLDivElement>(null)
  const seriesScrollRef                             = useRef<HTMLDivElement>(null)

  const userId  = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')

  const watchedMovies   = useWatchedStore((s) => s.movies[userKey])
  const watchedSeries   = useWatchedStore((s) => s.seriesData[userKey])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userKey])

  const watchlistMovies  = useWatchlistStore((s) => s.movies[userKey])
  const watchlistSeries  = useWatchlistStore((s) => s.series[userKey])
  const toggleWatchlistMovie  = useWatchlistStore((s) => s.removeMovie)
  const toggleWatchlistSeries = useWatchlistStore((s) => s.removeSeries)

  const userRatings = useRatingsStore((s) => s.ratings[userKey])
  const setRating   = useRatingsStore((s) => s.setRating)
  const { language } = useLanguageStore()

  const movieList  = useMemo(
    () => Object.values(watchedMovies ?? {}).sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0)),
    [watchedMovies],
  )
  const seriesList = useMemo(
    () => Object.values(watchedSeries ?? {})
      .filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0)
      .sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0)),
    [watchedSeries, watchedEpisodes],
  )

  const watchlistMovieList = useMemo(
    () => Object.values(watchlistMovies ?? {}).sort((a, b) => b.addedAt - a.addedAt),
    [watchlistMovies],
  )
  const watchlistSeriesList = useMemo(
    () => Object.values(watchlistSeries ?? {}).sort((a, b) => b.addedAt - a.addedAt),
    [watchlistSeries],
  )
  const { sagaGroups: watchlistSagas, standaloneMovies: watchlistStandalone } = useMemo(
    () => groupWatchlistMovies(watchlistMovieList),
    [watchlistMovieList],
  )

  const { sagaGroups, standaloneMovies } = useMemo(() => groupAndSortMovies(movieList), [movieList])

  const collectionResults = useQueries({
    queries: sagaGroups.map((g) => ({
      queryKey: ['collection-detail', g.id, language],
      queryFn: () => fetchCollectionDetail(g.id, language),
      staleTime: 24 * 60 * 60 * 1000,
    })),
  })

  const sagaDisplayedCounts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return sagaGroups.map((g, i) => {
      const parts = collectionResults[i]?.data?.parts
      if (!parts?.length) return g.movies.length
      const released = parts.filter((p) => p.release_date && p.release_date <= today).length
      return Math.max(released, g.movies.length)
    })
  }, [sagaGroups, collectionResults])

  // Sagas with only 1 released movie are demoted to standalone cards
  const { effectiveSagas, effectiveSagaCounts, effectiveStandalones } = useMemo(() => {
    const sagas: SagaGroup[] = []
    const counts: number[] = []
    const demoted: StoredMovie[] = []
    sagaGroups.forEach((group, i) => {
      const count = sagaDisplayedCounts[i] ?? group.movies.length
      if (count > 1) { sagas.push(group); counts.push(count) }
      else demoted.push(...group.movies)
    })
    const standalones = [...standaloneMovies, ...demoted]
      .sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0))
    return { effectiveSagas: sagas, effectiveSagaCounts: counts, effectiveStandalones: standalones }
  }, [sagaGroups, sagaDisplayedCounts, standaloneMovies])

  const seriesEpCounts = useMemo(
    () => new Map(seriesList.map((s) => [s.id, Object.keys(watchedEpisodes?.[s.id] ?? {}).length])),
    [seriesList, watchedEpisodes],
  )

  const watchedMovieIds  = useMemo(() => new Set(movieList.map((m) => m.id)), [movieList])
  const watchedSeriesIds = useMemo(() => new Set(seriesList.map((s) => s.id)), [seriesList])

  const handleRate = useCallback(
    (type: 'movie' | 'series', id: number, rating: Rating) => setRating(userKey, type, id, rating),
    [setRating, userKey],
  )

  const handleMovieRec = useCallback((movie: StoredMovie) => {
    setMovieRecSource((prev) => prev?.id === movie.id ? null : { id: movie.id, scrollId: movie.id, name: movie.title, posterPath: movie.poster_path })
  }, [])

  const handleSagaRec = useCallback((movie: StoredMovie, sagaName: string, groupId: number) => {
    setMovieRecSource((prev) => prev?.id === movie.id ? null : { id: movie.id, scrollId: groupId, name: sagaName, posterPath: movie.poster_path })
  }, [])

  const handleSeriesRec = useCallback((series: StoredSeries) => {
    setSeriesRecSource((prev) => prev?.id === series.id ? null : { id: series.id, scrollId: series.id, name: series.name, posterPath: series.poster_path })
  }, [])

  useEffect(() => {
    const el = sagaContainerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setSagaContainerPx(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!movieRecSource) return
    const scrollId = movieRecSource.scrollId
    const timer = setTimeout(() => {
      const container = sagaContainerRef.current
      const el = container?.querySelector(`[data-scroll-id="${scrollId}"]`) as HTMLElement | null
      if (!container || !el) return
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const target = container.scrollTop + elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2
      container.scrollTo({ top: target, behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [movieRecSource])

  useEffect(() => {
    if (!seriesRecSource) return
    const scrollId = seriesRecSource.scrollId
    const frame = requestAnimationFrame(() => {
      const container = seriesScrollRef.current
      const el = container?.querySelector(`[data-scroll-id="${scrollId}"]`) as HTMLElement | null
      if (!container || !el) return
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const target = container.scrollTop + elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2
      container.scrollTo({ top: target, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [seriesRecSource])

  const movieRatings  = userRatings?.movies ?? {}
  const seriesRatings = userRatings?.series ?? {}
  const isEmpty = tab === 'movies' ? movieList.length === 0 : tab === 'series' ? seriesList.length === 0 : false

  const sagasFirst = useMemo(() => computeSagasFirst(effectiveSagas, effectiveStandalones), [effectiveSagas, effectiveStandalones])
  const packedSagas = useMemo(() => binPackSagas(effectiveSagas, effectiveSagaCounts, sagaContainerPx), [effectiveSagas, effectiveSagaCounts, sagaContainerPx])

  const watchlistCount = watchlistMovieList.length + watchlistSeriesList.length

  const tabSwitcher = (
    <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      {([
        { value: 'movies',  icon: <FilmIcon size={13} />,                  labelKey: 'nav.movies',        count: movieList.length },
        { value: 'series',  icon: <TvIcon size={13} />,                    labelKey: 'nav.series',        count: seriesList.length },
        { value: 'towatch', icon: <HeartIcon size={13} strokeWidth={2} />, labelKey: 'myList.watchlist.tab', count: watchlistCount },
      ] as { value: Tab; icon: React.ReactNode; labelKey: string; count: number }[]).map(({ value, icon, labelKey, count }) => (
        <button
          key={value}
          onClick={() => { setTab(value); setMovieRecSource(null); setSeriesRecSource(null) }}
          className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded transition-colors ${
            tab === value
              ? 'bg-primary/20 text-primary font-medium'
              : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
          }`}
        >
          {icon}
          {t(labelKey)}
          {count > 0 && (
            <Tooltip content={String(count)} placement="bottom" disabled={count <= 99}>
              <span className={`min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-[10px] font-semibold leading-none px-1 ${
                tab === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground'
              }`}>
                {count > 99 ? '99+' : count}
              </span>
            </Tooltip>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <PageLayout title={t('myList.title')} start={<BookmarkIcon size={32} strokeWidth={1.5} />} end={tabSwitcher}>

      {isEmpty && (
        <div className="flex-1 flex items-center justify-center">
          <Text variant="small" className="text-muted-foreground text-center">
            {tab === 'movies' ? t('myList.emptyMovies') : t('myList.emptySeries')}
          </Text>
        </div>
      )}

      {/* Movies */}
      {tab === 'movies' && !isEmpty && (
        <div key="movies" className="flex-1 flex gap-0 min-h-0 animate-fade-in">
          <div ref={sagaContainerRef} className="flex-1 overflow-y-auto space-y-6 min-w-0">
            {(() => {
              const sagasSection = effectiveSagas.length > 0 && (
                <div className="flex flex-col gap-4 pt-0.5 px-0.5">
                  {packedSagas.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex flex-wrap gap-4">
                      {row.map((group) => (
                        <div
                          key={group.id}
                          data-scroll-id={group.id}
                          className={`rounded-xl border border-border/40 px-3 pt-3 pb-2 flex flex-col gap-2 h-full bg-cream-100 dark:bg-gray-900 ${
                            group.movies.some((m) => movieRecSource?.id === m.id) ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <SagaCard
                            group={group}
                            movieRatings={movieRatings}
                            userRatings={userRatings?.movies}
                            movieRecSource={movieRecSource}
                            onRate={(id, r) => handleRate('movie', id, r)}
                            onMovieClick={setSelectedMovieId}
                            onSagaRec={handleSagaRec}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )

              const standaloneSection = effectiveStandalones.length > 0 && (
                <div className="flex flex-col gap-3">
                  {effectiveSagas.length > 0 && (
                    <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mt-2">{t('myList.noSaga')}</Text>
                  )}
                  <div className="flex flex-wrap gap-4 px-0.5">
                    {effectiveStandalones.map((movie, i) => {
                      const rated = (movieRatings[movie.id] ?? 0) >= RATING_THRESHOLD
                      return (
                        <div key={movie.id} data-scroll-id={movie.id}>
                          <MovieCard
                            movie={movie}
                            rating={userRatings?.movies?.[movie.id] ?? null}
                            onRate={(r) => handleRate('movie', movie.id, r)}
                            onClick={() => setSelectedMovieId(movie.id)}
                            eager={i < 6}
                            onShowRecommendations={rated ? () => handleMovieRec(movie) : undefined}
                            isRecommendationSource={movieRecSource?.id === movie.id}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )

              return sagasFirst
                ? <>{sagasSection}{standaloneSection}</>
                : <>{standaloneSection}{sagasSection}</>
            })()}
          </div>

          {movieRecSource && (
            <RecommendationsDrawer
              type="movie"
              sourceId={movieRecSource.id}
              sourceName={movieRecSource.name}
              sourcePosterPath={movieRecSource.posterPath}
              watchedIds={watchedMovieIds}
              onSelect={setSelectedMovieId}
              onClose={() => setMovieRecSource(null)}
            />
          )}
        </div>
      )}

      {/* Series */}
      {tab === 'series' && !isEmpty && (
        <div key="series" className="flex-1 flex gap-0 min-h-0 animate-fade-in">
          <div ref={seriesScrollRef} className="flex-1 overflow-y-auto min-w-0">
            <div className="flex flex-wrap gap-4 pt-0.5 px-0.5">
              {seriesList.map((series, i) => {
                const rated = (seriesRatings[series.id] ?? 0) >= RATING_THRESHOLD
                return (
                  <div key={series.id} data-scroll-id={series.id}>
                    <SeriesCard
                      series={series}
                      watchedEpisodes={seriesEpCounts.get(series.id) ?? 0}
                      rating={userRatings?.series?.[series.id] ?? null}
                      onRate={(r) => handleRate('series', series.id, r)}
                      onClick={() => setSelectedSeriesId(series.id)}
                      eager={i < 6}
                      onShowRecommendations={rated ? () => handleSeriesRec(series) : undefined}
                      isRecommendationSource={seriesRecSource?.id === series.id}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {seriesRecSource && (
            <RecommendationsDrawer
              type="series"
              sourceId={seriesRecSource.id}
              sourceName={seriesRecSource.name}
              sourcePosterPath={seriesRecSource.posterPath}
              watchedIds={watchedSeriesIds}
              onSelect={setSelectedSeriesId}
              onClose={() => setSeriesRecSource(null)}
            />
          )}
        </div>
      )}

      {/* Por ver — two-column layout (movies left, series right) */}
      {tab === 'towatch' && (
        <div key="towatch" className="flex-1 flex gap-6 min-h-0 animate-fade-in">

          {/* Movies column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FilmIcon size={13} />
              <Text variant="caption" className="font-semibold uppercase tracking-[0.14em]">{t('nav.movies')}</Text>
            </div>
            {watchlistMovieList.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Text variant="small" className="text-muted-foreground text-center">{t('myList.watchlist.emptyMovies')}</Text>
              </div>
            ) : (
              <div className="space-y-6">
                {watchlistSagas.length > 0 && (
                  <div className="flex flex-wrap gap-4 items-start">
                    {watchlistSagas.map((group) => (
                      <WatchlistSagaCard
                        key={group.id}
                        group={group}
                        watchedMovies={watchedMovies}
                        watchlistMoviesMap={watchlistMovies}
                        onMovieClick={setSelectedMovieId}
                        onRemove={(movieId) => toggleWatchlistMovie(userKey, movieId)}
                      />
                    ))}
                  </div>
                )}
                {watchlistStandalone.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {watchlistSagas.length > 0 && (
                      <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t('myList.noSaga')}</Text>
                    )}
                    <div className="flex flex-wrap gap-4 px-0.5">
                      {watchlistStandalone.map((movie, i) => (
                        <WatchlistCard
                          key={movie.id}
                          posterPath={movie.poster_path}
                          title={movie.title}
                          year={movie.release_date ? new Date(movie.release_date).getFullYear() : null}
                          onClick={() => setSelectedMovieId(movie.id)}
                          onRemove={() => toggleWatchlistMovie(userKey, movie.id)}
                          eager={i < 6}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-border/40 self-stretch shrink-0" />

          {/* Series column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TvIcon size={13} />
              <Text variant="caption" className="font-semibold uppercase tracking-[0.14em]">{t('nav.series')}</Text>
            </div>
            {watchlistSeriesList.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Text variant="small" className="text-muted-foreground text-center">{t('myList.watchlist.emptySeries')}</Text>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 px-0.5">
                {watchlistSeriesList.map((series, i) => (
                  <WatchlistCard
                    key={series.id}
                    posterPath={series.poster_path}
                    title={series.name}
                    year={series.first_air_date ? new Date(series.first_air_date).getFullYear() : null}
                    onClick={() => setSelectedSeriesId(series.id)}
                    onRemove={() => toggleWatchlistSeries(userKey, series.id)}
                    eager={i < 6}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {selectedMovieId !== null && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
      {selectedSeriesId !== null && (
        <SeriesDetailModal seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />
      )}
    </PageLayout>
  )
}
