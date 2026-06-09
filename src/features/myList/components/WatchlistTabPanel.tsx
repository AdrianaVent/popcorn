'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import { FilmIcon, TvIcon } from '@/components/icons'
import WatchlistCard from '@/features/myList/components/WatchlistCard'
import WatchlistSagaCard from '@/features/myList/components/WatchlistSagaCard'
import { useWatchedStore } from '@/store/watchedStore'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useUserStore } from '@/store/userStore'
import { groupWatchlistMovies } from '../myListUtils'

type Props = {
  onMovieClick: (id: number) => void
  onSeriesClick: (id: number) => void
}

export default function WatchlistTabPanel({ onMovieClick, onSeriesClick }: Props) {
  const { t } = useTranslation()
  const userId = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')

  const watchedMovies   = useWatchedStore((s) => s.movies[userKey])
  const watchlistMovies = useWatchlistStore((s) => s.movies[userKey])
  const watchlistSeries = useWatchlistStore((s) => s.series[userKey])
  const removeMovie     = useWatchlistStore((s) => s.removeMovie)
  const removeSeries    = useWatchlistStore((s) => s.removeSeries)

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

  return (
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
                    onMovieClick={onMovieClick}
                    onRemove={(movieId) => removeMovie(userKey, movieId)}
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
                      onClick={() => onMovieClick(movie.id)}
                      onRemove={() => removeMovie(userKey, movie.id)}
                      eager={i < 6}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                onClick={() => onSeriesClick(series.id)}
                onRemove={() => removeSeries(userKey, series.id)}
                eager={i < 6}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
