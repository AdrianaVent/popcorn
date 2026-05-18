'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import Tabs from '@/components/ui/Tabs'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import MovieCard from '@/features/myList/components/MovieCard'
import SeriesCard from '@/features/myList/components/SeriesCard'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useUserStore } from '@/store/userStore'
import type { Rating } from '@/store/ratingsStore'
import type { StoredMovie } from '@/store/watchedStore'
import PageLayout from '@/components/layouts/PageLayout'
import { BookmarkIcon } from '@/components/icons'

type Tab = 'movies' | 'series'

const TABS: { value: Tab; labelKey: string }[] = [
  { value: 'movies', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.series' },
]

type SagaGroup = {
  id: number
  name: string
  movies: StoredMovie[]
}

export default function MyListFeature() {
  const { t } = useTranslation()
  const [tab, setTab]                       = useState<Tab>('movies')
  const [groupBySaga, setGroupBySaga]       = useState(false)
  const [selectedMovieId, setSelectedMovieId]   = useState<number | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null)

  const userId  = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')

  const watchedMovies   = useWatchedStore((s) => s.movies[userKey])
  const watchedSeries   = useWatchedStore((s) => s.seriesData[userKey])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userKey])

  const userRatings  = useRatingsStore((s) => s.ratings[userKey])
  const setRating    = useRatingsStore((s) => s.setRating)

  const movieList  = useMemo(() => Object.values(watchedMovies ?? {}), [watchedMovies])
  const seriesList = useMemo(
    () => Object.values(watchedSeries ?? {}).filter(
      (s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0
    ),
    [watchedSeries, watchedEpisodes],
  )

  // Group movies by collection; ungrouped movies are returned as single-item groups
  const sagaGroups = useMemo((): SagaGroup[] => {
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
    groups.sort((a, b) => a.name.localeCompare(b.name))

    standalone.forEach((m) => groups.push({ id: m.id, name: '', movies: [m] }))
    return groups
  }, [movieList])

  const seriesEpCounts = useMemo(
    () => new Map(seriesList.map((s) => [s.id, Object.keys(watchedEpisodes?.[s.id] ?? {}).length])),
    [seriesList, watchedEpisodes],
  )

  const handleRate = useCallback(
    (type: 'movie' | 'series', id: number, rating: Rating) => setRating(userKey, type, id, rating),
    [setRating, userKey],
  )

  const isEmpty = tab === 'movies' ? movieList.length === 0 : seriesList.length === 0

  return (
    <PageLayout title={t('myList.title')} start={<BookmarkIcon size={32} strokeWidth={1.5} />}>
      {/* Tabs + count badge */}
      <Tabs
        tabs={TABS.map((t_) => ({ value: t_.value, label: t(t_.labelKey) }))}
        activeTab={tab}
        onTabChange={setTab}
        variant="plain"
        start={
          <>
            {(tab === 'movies' ? movieList.length : seriesList.length) > 0 && (
              <span className="text-[13px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground capitalize">
                {tab === 'movies'
                  ? t('myList.moviesCount', { count: movieList.length })
                  : t('myList.seriesCount', { count: seriesList.length })}
              </span>
            )}
            {tab === 'movies' && movieList.length > 0 && (
              <button
                onClick={() => setGroupBySaga((v) => !v)}
                className={[
                  'text-[11px] px-2.5 py-0.5 rounded-md border transition-colors mr-3',
                  groupBySaga
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted border-border text-foreground/70 hover:text-foreground',
                ].join(' ')}
              >
                {t('myList.groupBySaga')}
              </button>
            )}
          </>
        }
      />


      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex items-center justify-center">
          <Text variant="small" className="text-muted-foreground text-center">
            {tab === 'movies' ? t('myList.emptyMovies') : t('myList.emptySeries')}
          </Text>
        </div>
      )}

      {/* Movies grid */}
      {tab === 'movies' && !isEmpty && (
        <div key={String(groupBySaga)} className="flex-1 overflow-y-auto">
          {groupBySaga ? (
            <div className="flex flex-col gap-8 pb-6">
              {sagaGroups.filter((g) => g.name).map((group) => (
                <div key={group.id} className="flex flex-col gap-3">
                  <Text variant="small" className="font-semibold text-foreground border-b border-border pb-1">
                    {group.name}
                  </Text>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                    {group.movies.map((movie, i) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        rating={userRatings?.movies?.[movie.id] ?? null}
                        onRate={(r) => handleRate('movie', movie.id, r)}
                        onClick={() => setSelectedMovieId(movie.id)}
                        eager={i === 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {sagaGroups.some((g) => !g.name) && (
                <div className="flex flex-col gap-3">
                  <Text variant="small" className="font-semibold text-foreground border-b border-border pb-1">
                    {t('myList.noSaga')}
                  </Text>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                    {sagaGroups.filter((g) => !g.name).map((group) => (
                      <MovieCard
                        key={group.id}
                        movie={group.movies[0]}
                        rating={userRatings?.movies?.[group.movies[0].id] ?? null}
                        onRate={(r) => handleRate('movie', group.movies[0].id, r)}
                        onClick={() => setSelectedMovieId(group.movies[0].id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-4 pb-6">
              {movieList.map((movie, i) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  rating={userRatings?.movies?.[movie.id] ?? null}
                  onRate={(r) => handleRate('movie', movie.id, r)}
                  onClick={() => setSelectedMovieId(movie.id)}
                  eager={i === 0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Series grid */}
      {tab === 'series' && !isEmpty && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-4 pb-6">
            {seriesList.map((series, i) => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  watchedEpisodes={seriesEpCounts.get(series.id) ?? 0}
                  rating={userRatings?.series?.[series.id] ?? null}
                  onRate={(r) => handleRate('series', series.id, r)}
                  onClick={() => setSelectedSeriesId(series.id)}
                  eager={i === 0}
                />
            ))}
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
