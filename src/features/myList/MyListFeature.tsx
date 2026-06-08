'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import MovieCard from '@/features/myList/components/MovieCard'
import SeriesCard from '@/features/myList/components/SeriesCard'
import SagaCard from '@/features/myList/components/SagaCard'
import WatchlistSagaCard from '@/features/myList/components/WatchlistSagaCard'
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
import PageLayout from '@/components/layouts/PageLayout'
import Tooltip from '@/components/ui/Tooltip'
import { BookmarkIcon, FilmIcon, TvIcon, HeartIcon } from '@/components/icons'
import WatchlistCard from '@/features/myList/components/WatchlistCard'
import FiltersPanel from '@/components/common/FiltersPanel'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import type { FiltersSchema } from '@/types/table'
import {
  RATING_THRESHOLD,
  type SagaGroup,
  type WatchlistSagaGroup,
  type RecommendationSource,
  formatSagaName,
} from './myListUtils'
export type { SagaGroup, WatchlistSagaGroup }
export { formatSagaName }

type MyListFilters = { title: string; genre_ids: number[]; min_rating: number }
const INITIAL_FILTERS: MyListFilters = { title: '', genre_ids: [], min_rating: 0 }

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

  const [movieFilters, setMovieFilters]   = useState<MyListFilters>(INITIAL_FILTERS)
  const [seriesFilters, setSeriesFilters] = useState<MyListFilters>(INITIAL_FILTERS)

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
  const movieRatings  = useMemo(() => userRatings?.movies ?? {}, [userRatings])
  const seriesRatings = useMemo(() => userRatings?.series ?? {}, [userRatings])

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

  const movieGenreOptions = useMemo(() => {
    const seen = new Map<string, number>()
    movieList.forEach((m) => {
      m.genre_ids?.forEach((id) => {
        const name = resolveGenreName(id, language)
        if (name && !seen.has(name)) seen.set(name, id)
      })
    })
    return [...seen.entries()]
      .map(([label, id]) => ({ value: id, label, icon: getGenreIcon(id) ?? undefined }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [movieList, language])

  const seriesGenreOptions = useMemo(() => {
    const seen = new Map<string, number>()
    seriesList.forEach((s) => {
      s.genre_ids?.forEach((id) => {
        const name = resolveGenreName(id, language)
        if (name && !seen.has(name)) seen.set(name, id)
      })
    })
    return [...seen.entries()]
      .map(([label, id]) => ({ value: id, label, icon: getGenreIcon(id) ?? undefined }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [seriesList, language])

  const movieFiltersSchema = useMemo(() => {
    const schema: FiltersSchema<MyListFilters> = [
      { key: 'title', label: 'movies.filters.title', type: 'text', grow: true },
    ]
    if (movieGenreOptions.length > 0) {
      schema.push({ key: 'genre_ids', label: 'movies.filters.genres', type: 'genre-multi', options: movieGenreOptions })
    }
    schema.push({ key: 'min_rating', label: 'movies.filters.ratingGte', type: 'star' })
    return schema
  }, [movieGenreOptions])

  const seriesFiltersSchema = useMemo(() => {
    const schema: FiltersSchema<MyListFilters> = [
      { key: 'title', label: 'movies.filters.title', type: 'text', grow: true },
    ]
    if (seriesGenreOptions.length > 0) {
      schema.push({ key: 'genre_ids', label: 'movies.filters.genres', type: 'genre-multi', options: seriesGenreOptions })
    }
    schema.push({ key: 'min_rating', label: 'movies.filters.ratingGte', type: 'star' })
    return schema
  }, [seriesGenreOptions])

  const filteredMovieList = useMemo(() => {
    const { title, genre_ids, min_rating } = movieFilters
    const q = title.toLowerCase()
    const selectedGenreNames = genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean)
    return movieList.filter((m) => {
      if (q && !m.title.toLowerCase().includes(q)) return false
      if (min_rating > 0 && (movieRatings[m.id] ?? 0) * 2 < min_rating) return false
      if (selectedGenreNames.length > 0 && m.genre_ids?.length) {
        const movieNames = new Set(m.genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean))
        if (!selectedGenreNames.some((name) => movieNames.has(name))) return false
      }
      return true
    })
  }, [movieList, movieFilters, movieRatings, language])

  const hasFilteredMovies = filteredMovieList.length > 0

  const filteredSeriesList = useMemo(() => {
    const { title, genre_ids, min_rating } = seriesFilters
    const q = title.toLowerCase()
    const selectedGenreNames = genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean)
    return seriesList.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false
      if (min_rating > 0 && (seriesRatings[s.id] ?? 0) * 2 < min_rating) return false
      if (selectedGenreNames.length > 0 && s.genre_ids?.length) {
        const seriesNames = new Set(s.genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean))
        if (!selectedGenreNames.some((name) => seriesNames.has(name))) return false
      }
      return true
    })
  }, [seriesList, seriesFilters, seriesRatings, language])

  const hasFilteredSeries = filteredSeriesList.length > 0

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

  const { sagaGroups, standaloneMovies } = useMemo(() => groupAndSortMovies(filteredMovieList), [filteredMovieList])

  const collectionResults = useQueries({
    queries: sagaGroups.map((g) => ({
      queryKey: ['collection-detail', g.id, language],
      queryFn: () => fetchCollectionDetail(g.id, language),
      staleTime: 24 * 60 * 60 * 1000,
    })),
  })

  const sagaDisplayedCounts = useMemo(() => {
    return sagaGroups.map((g, i) => {
      const parts = collectionResults[i]?.data?.parts
      if (!parts?.length) return g.movies.length
      const withDate = parts.filter((p) => !!p.release_date).length
      return Math.max(withDate, g.movies.length)
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

  const handleCloseMovieDrawer = useCallback(() => setMovieRecSource(null), [])
  const handleCloseSeriesDrawer = useCallback(() => setSeriesRecSource(null), [])

  useEffect(() => {
    const el = sagaContainerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setSagaContainerPx(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [tab])

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

  const sagasFirst = useMemo(() => computeSagasFirst(effectiveSagas, effectiveStandalones), [effectiveSagas, effectiveStandalones])
  const packedSagas = useMemo(() => binPackSagas(effectiveSagas, effectiveSagaCounts, sagaContainerPx), [effectiveSagas, effectiveSagaCounts, sagaContainerPx])

  const movieExcludeIds = useMemo(() => {
    if (!movieRecSource) return watchedMovieIds
    const sagaIdx = sagaGroups.findIndex((g) => g.id === movieRecSource.scrollId)
    if (sagaIdx === -1) return watchedMovieIds
    const parts = collectionResults[sagaIdx]?.data?.parts ?? []
    return new Set([...watchedMovieIds, ...parts.map((p) => p.id)])
  }, [movieRecSource, watchedMovieIds, sagaGroups, collectionResults])

  const watchlistCount = watchlistMovieList.length + watchlistSeriesList.length

  const TABS: { value: Tab; icon: React.ReactNode; labelKey: string; count: number }[] = [
    { value: 'movies',  icon: <FilmIcon size={13} />,                  labelKey: 'nav.movies',           count: movieList.length },
    { value: 'series',  icon: <TvIcon size={13} />,                    labelKey: 'nav.series',           count: seriesList.length },
    { value: 'towatch', icon: <HeartIcon size={13} strokeWidth={2} />, labelKey: 'myList.watchlist.tab', count: watchlistCount },
  ]

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    let nextIdx: number | null = null
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % TABS.length
    if (e.key === 'ArrowLeft')  nextIdx = (currentIdx - 1 + TABS.length) % TABS.length
    if (e.key === 'Home')       nextIdx = 0
    if (e.key === 'End')        nextIdx = TABS.length - 1
    if (nextIdx !== null) {
      e.preventDefault()
      const nextTab = TABS[nextIdx].value
      setTab(nextTab)
      setMovieRecSource(null)
      setSeriesRecSource(null)
      document.getElementById(`mylist-tab-${nextTab}`)?.focus()
    }
  }

  const tabSwitcher = (
    <div role="tablist" aria-label={t('myList.title')} className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      {TABS.map(({ value, icon, labelKey, count }, idx) => (
        <button
          key={value}
          id={`mylist-tab-${value}`}
          data-cy={`tab-${value}`}
          role="tab"
          aria-selected={tab === value}
          aria-controls={`mylist-panel-${value}`}
          tabIndex={tab === value ? 0 : -1}
          onClick={() => { setTab(value); setMovieRecSource(null); setSeriesRecSource(null) }}
          onKeyDown={(e) => handleTabKeyDown(e, idx)}
          className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded transition-colors ${
            tab === value
              ? 'bg-primary/20 text-primary font-medium hc:bg-primary hc:text-primary-foreground'
              : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
          }`}
        >
          <span aria-hidden="true">{icon}</span>
          {t(labelKey)}
          {count > 0 && (
            <Tooltip content={String(count)} placement="bottom" disabled={count <= 99}>
              <span className={`min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-[10px] font-semibold leading-none px-1 ${
                tab === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground hc:bg-muted hc:text-muted-foreground'
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
    <PageLayout title={t('myList.title')} start={<span aria-hidden="true"><BookmarkIcon size={32} strokeWidth={1.5} /></span>} end={tabSwitcher}>

      <div
        role="tabpanel"
        id={`mylist-panel-${tab}`}
        aria-labelledby={`mylist-tab-${tab}`}
        tabIndex={0}
        className="flex-1 flex flex-col min-h-0 outline-none"
      >

      {/* Movies */}
      {tab === 'movies' && (
        <div className="flex-1 flex flex-col min-h-0">
          {movieList.length > 0 && (
            <div className="mb-4">
              <FiltersPanel schema={movieFiltersSchema} filters={movieFilters} onChange={(next) => setMovieFilters(next)} />
            </div>
          )}
          {movieList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Text variant="small" className="text-muted-foreground text-center">{t('myList.emptyMovies')}</Text>
            </div>
          ) : !hasFilteredMovies ? (
            <div className="flex-1 flex items-center justify-center">
              <Text variant="small" className="text-muted-foreground text-center">{t('myList.filters.noResults')}</Text>
            </div>
          ) : (
            <div className="flex-1 flex gap-0 min-h-0 animate-fade-in">
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
                              className={`rounded-xl border border-border/40 hc:border-border px-3 pt-3 pb-2 flex flex-col gap-2 h-full bg-cream-100 dark:bg-gray-900 ${
                                group.movies.some((m) => movieRecSource?.id === m.id) ? 'ring-2 ring-primary' : ''
                              }`}
                            >
                              <SagaCard
                                group={group}
                                movieRatings={movieRatings}
                                userRatings={userRatings?.movies}
                                movieRecSource={movieRecSource}
                                watchedMovies={watchedMovies}
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
                  watchedIds={movieExcludeIds}
                  onSelect={setSelectedMovieId}
                  onClose={handleCloseMovieDrawer}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Series */}
      {tab === 'series' && (
        <div className="flex-1 flex flex-col min-h-0">
          {seriesList.length > 0 && (
            <div className="mb-4">
              <FiltersPanel schema={seriesFiltersSchema} filters={seriesFilters} onChange={(next) => setSeriesFilters(next)} />
            </div>
          )}
          {seriesList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Text variant="small" className="text-muted-foreground text-center">{t('myList.emptySeries')}</Text>
            </div>
          ) : !hasFilteredSeries ? (
            <div className="flex-1 flex items-center justify-center">
              <Text variant="small" className="text-muted-foreground text-center">{t('myList.filters.noResults')}</Text>
            </div>
          ) : (
            <div className="flex-1 flex gap-0 min-h-0 animate-fade-in">
              <div ref={seriesScrollRef} className="flex-1 overflow-y-auto min-w-0">
                <div className="flex flex-wrap gap-4 pt-0.5 px-0.5">
                  {filteredSeriesList.map((series, i) => {
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
                  onClose={handleCloseSeriesDrawer}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Por ver — two-column layout (movies left, series right) */}
      {tab === 'towatch' && (
        <div className="flex-1 flex gap-6 min-h-0 animate-fade-in">

          {/* Movies column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden="true"><FilmIcon size={13} /></span>
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
          <div className="w-px bg-border/40 hc:bg-border self-stretch shrink-0" />

          {/* Series column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden="true"><TvIcon size={13} /></span>
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

      </div>{/* end tabpanel */}

      {selectedMovieId !== null && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
      {selectedSeriesId !== null && (
        <SeriesDetailModal seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />
      )}
    </PageLayout>
  )
}
