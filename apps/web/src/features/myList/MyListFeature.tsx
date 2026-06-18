'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import PageLayout from '@/components/layouts/PageLayout'
import Tooltip from '@/components/ui/Tooltip'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import MoviesTabPanel from '@/features/myList/components/MoviesTabPanel'
import SeriesTabPanel from '@/features/myList/components/SeriesTabPanel'
import WatchlistTabPanel from '@/features/myList/components/WatchlistTabPanel'
import { BookmarkIcon, FilmIcon, TvIcon, HeartIcon } from '@/components/icons'
import { useWatchedStore } from '@/store/watchedStore'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useUserStore } from '@/store/userStore'
import type { StoredMovie, StoredSeries } from '@/store/watchedStore'
import {
  type RecommendationSource,
  type SagaGroup,
  type WatchlistSagaGroup,
  formatSagaName,
} from './myListUtils'
export type { SagaGroup, WatchlistSagaGroup }
export { formatSagaName }

type Tab = 'movies' | 'series' | 'towatch'

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
  const watchlistMovies = useWatchlistStore((s) => s.movies[userKey])
  const watchlistSeries = useWatchlistStore((s) => s.series[userKey])

  const movieCount     = Object.keys(watchedMovies ?? {}).length
  const seriesCount    = Object.values(watchedSeries ?? {}).filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0).length
  const watchlistCount = Object.keys(watchlistMovies ?? {}).length + Object.keys(watchlistSeries ?? {}).length

  const handleMovieRec = useCallback((movie: StoredMovie) => {
    setMovieRecSource((prev) => prev?.id === movie.id ? null : { id: movie.id, scrollId: movie.id, name: movie.title, posterPath: movie.poster_path })
  }, [])

  const handleSagaRec = useCallback((movie: StoredMovie, sagaName: string, groupId: number) => {
    setMovieRecSource((prev) => prev?.id === movie.id ? null : { id: movie.id, scrollId: groupId, name: sagaName, posterPath: movie.poster_path })
  }, [])

  const handleSeriesRec = useCallback((series: StoredSeries) => {
    setSeriesRecSource((prev) => prev?.id === series.id ? null : { id: series.id, scrollId: series.id, name: series.name, posterPath: series.poster_path })
  }, [])

  const closeMovieDrawer  = useCallback(() => setMovieRecSource(null), [])
  const closeSeriesDrawer = useCallback(() => setSeriesRecSource(null), [])

  const TABS = useMemo(() => [
    { value: 'movies'  as Tab, icon: <FilmIcon size={13} />,                  labelKey: 'nav.movies',           count: movieCount },
    { value: 'series'  as Tab, icon: <TvIcon size={13} />,                    labelKey: 'nav.series',           count: seriesCount },
    { value: 'towatch' as Tab, icon: <HeartIcon size={13} strokeWidth={2} />, labelKey: 'myList.watchlist.tab', count: watchlistCount },
  ], [movieCount, seriesCount, watchlistCount])

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    let nextIdx: number | null = null
    if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % TABS.length
    if (e.key === 'ArrowLeft')  nextIdx = (currentIdx - 1 + TABS.length) % TABS.length
    if (e.key === 'Home')       nextIdx = 0
    if (e.key === 'End')        nextIdx = TABS.length - 1
    if (nextIdx !== null) {
      e.preventDefault()
      const nextTab = TABS[nextIdx].value
      setTab(nextTab); setMovieRecSource(null); setSeriesRecSource(null)
      document.getElementById(`mylist-tab-${nextTab}`)?.focus()
    }
  }

  const switchTab = (value: Tab) => { setTab(value); setMovieRecSource(null); setSeriesRecSource(null) }

  const tabBar = (
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
          onClick={() => switchTab(value)}
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
    <PageLayout title={t('myList.title')} start={<span aria-hidden="true"><BookmarkIcon size={32} strokeWidth={1.5} /></span>} end={tabBar}>
      <div
        role="tabpanel"
        id={`mylist-panel-${tab}`}
        aria-labelledby={`mylist-tab-${tab}`}
        tabIndex={0}
        className="flex-1 flex flex-col min-h-0 outline-none"
      >
        {tab === 'movies'  && <MoviesTabPanel  recSource={movieRecSource}  onMovieClick={setSelectedMovieId}  onShowRec={handleMovieRec}  onSagaRec={handleSagaRec}  onCloseDrawer={closeMovieDrawer} />}
        {tab === 'series'  && <SeriesTabPanel  recSource={seriesRecSource} onSeriesClick={setSelectedSeriesId} onShowRec={handleSeriesRec} onCloseDrawer={closeSeriesDrawer} />}
        {tab === 'towatch' && <WatchlistTabPanel onMovieClick={setSelectedMovieId} onSeriesClick={setSelectedSeriesId} />}
      </div>

      {selectedMovieId  !== null && <MovieDetailModal  movieId={selectedMovieId}   onClose={() => setSelectedMovieId(null)} />}
      {selectedSeriesId !== null && <SeriesDetailModal seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />}
    </PageLayout>
  )
}
