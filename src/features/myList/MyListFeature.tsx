'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import MovieCard from '@/features/myList/components/MovieCard'
import SeriesCard from '@/features/myList/components/SeriesCard'
import RecommendationsDrawer from '@/features/myList/components/RecommendationsDrawer'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import type { Rating } from '@/store/ratingsStore'
import type { StoredMovie, StoredSeries } from '@/store/watchedStore'
import type { TMDBCollectionPart } from '@/types/tmdb'
import PageLayout from '@/components/layouts/PageLayout'
import Tooltip from '@/components/ui/Tooltip'
import { BookmarkIcon, FilmIcon, TvIcon } from '@/components/icons'
import { getTMDBImageUrl } from '@/utils/tmdb'

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

type Tab = 'movies' | 'series'

type RecommendationSource = { id: number; name: string; posterPath: string | null } | null

function UnwatchedMoviePlaceholder({ part, onClick }: { part: TMDBCollectionPart; onClick: () => void }) {
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
  onSagaRec: (movie: StoredMovie, sagaName: string) => void
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
            onClick={bestRatedMovie ? () => onSagaRec(bestRatedMovie, formatSagaName(group.name)) : undefined}
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

export default function MyListFeature() {
  const { t } = useTranslation()
  const [tab, setTab]                           = useState<Tab>('movies')
  const [selectedMovieId, setSelectedMovieId]   = useState<number | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null)
  const [movieRecSource, setMovieRecSource]     = useState<RecommendationSource>(null)
  const [seriesRecSource, setSeriesRecSource]   = useState<RecommendationSource>(null)

  const userId  = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')

  const watchedMovies   = useWatchedStore((s) => s.movies[userKey])
  const watchedSeries   = useWatchedStore((s) => s.seriesData[userKey])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userKey])

  const userRatings = useRatingsStore((s) => s.ratings[userKey])
  const setRating   = useRatingsStore((s) => s.setRating)

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

  const { sagaGroups, standaloneMovies } = useMemo(() => groupAndSortMovies(movieList), [movieList])

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
    setMovieRecSource((prev) => prev?.id === movie.id ? null : { id: movie.id, name: movie.title, posterPath: movie.poster_path })
  }, [])

  const handleSagaRec = useCallback((movie: StoredMovie, sagaName: string) => {
    setMovieRecSource((prev) => prev?.id === movie.id ? null : { id: movie.id, name: sagaName, posterPath: movie.poster_path })
  }, [])

  const handleSeriesRec = useCallback((series: StoredSeries) => {
    setSeriesRecSource((prev) => prev?.id === series.id ? null : { id: series.id, name: series.name, posterPath: series.poster_path })
  }, [])

  const movieRatings  = userRatings?.movies ?? {}
  const seriesRatings = userRatings?.series ?? {}
  const isEmpty = tab === 'movies' ? movieList.length === 0 : seriesList.length === 0

  const sagasFirst = useMemo(() => computeSagasFirst(sagaGroups, standaloneMovies), [sagaGroups, standaloneMovies])

  const tabSwitcher = (
    <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      {([
        { value: 'movies', icon: <FilmIcon size={13} />, labelKey: 'nav.movies' },
        { value: 'series', icon: <TvIcon size={13} />,  labelKey: 'nav.series' },
      ] as { value: Tab; icon: React.ReactNode; labelKey: string }[]).map(({ value, icon, labelKey }) => (
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
          <div className="flex-1 overflow-y-auto space-y-6 min-w-0">
            {(() => {
              const sagasSection = sagaGroups.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-0.5 px-0.5">
                  {sagaGroups.map((group) => (
                    <div
                      key={group.id}
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
              )

              const standaloneSection = standaloneMovies.length > 0 && (
                <div className="flex flex-col gap-3">
                  {sagaGroups.length > 0 && (
                    <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mt-2">{t('myList.noSaga')}</Text>
                  )}
                  <div className="flex flex-wrap gap-4 px-0.5">
                    {standaloneMovies.map((movie, i) => {
                      const rated = (movieRatings[movie.id] ?? 0) >= RATING_THRESHOLD
                      return (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          rating={userRatings?.movies?.[movie.id] ?? null}
                          onRate={(r) => handleRate('movie', movie.id, r)}
                          onClick={() => setSelectedMovieId(movie.id)}
                          eager={i < 6}
                          onShowRecommendations={rated ? () => handleMovieRec(movie) : undefined}
                          isRecommendationSource={movieRecSource?.id === movie.id}
                        />
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
          <div className="flex-1 overflow-y-auto min-w-0">
            <div className="flex flex-wrap gap-4 pt-0.5 px-0.5">
              {seriesList.map((series, i) => {
                const rated = (seriesRatings[series.id] ?? 0) >= RATING_THRESHOLD
                return (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    watchedEpisodes={seriesEpCounts.get(series.id) ?? 0}
                    rating={userRatings?.series?.[series.id] ?? null}
                    onRate={(r) => handleRate('series', series.id, r)}
                    onClick={() => setSelectedSeriesId(series.id)}
                    eager={i < 6}
                    onShowRecommendations={rated ? () => handleSeriesRec(series) : undefined}
                    isRecommendationSource={seriesRecSource?.id === series.id}
                  />
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

      {selectedMovieId !== null && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
      {selectedSeriesId !== null && (
        <SeriesDetailModal seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />
      )}
    </PageLayout>
  )
}
