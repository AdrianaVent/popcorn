'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DonutChart from '@/components/ui/DonutChart'
import ReleaseCalendar from '@/features/home/components/ReleaseCalendar'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import { useUserMovieGenres, useGlobalMovieGenres } from '@/features/home/hooks/useMovieGenres'
import { useUserSeriesGenres, useGlobalSeriesGenres } from '@/features/home/hooks/useSeriesGenres'
import { useMovieReleases, useSeriesReleases } from '@/features/home/hooks/useReleases'
import { useGlobalMovieTop10, useGlobalSeriesTop10, useUserMovieTop10, useUserSeriesTop10, buildUserMoviePool, buildUserSeriesPool } from '@/features/home/hooks/useTop10'
import Top10Card from '@/features/home/components/Top10Card'
import StatsCard from '@/features/home/components/StatsCard'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { buildGenreMapForLanguage } from '@/config/genres'
import { getGenreIconByName } from '@/config/genreIcons'
import PageLayout from '@/components/layouts/PageLayout'
import { HomeIcon } from '@/components/icons'

import { type ContentTab } from '@/components/ui/ContentTabToggle'



export default function HomeFeature() {
  const { t } = useTranslation()
  const [genreTab, setGenreTab]       = useState<ContentTab>('movies')
  const [top10Tab, setTop10Tab]       = useState<ContentTab>('movies')
  const [calendarTab, setCalendarTab] = useState<ContentTab>('movies')
  const [calendar, setCalendar]       = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [calendarDir, setCalendarDir] = useState<'left' | 'right' | null>(null)
  const [selectedMovieId, setSelectedMovieId]   = useState<number | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null)

  const userId   = useUserStore((s) => s.userId) ?? ''
  const role     = useUserStore((s) => s.role)
  const language = useLanguageStore((s) => s.language)
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'
  const watchedMovies   = useWatchedStore((s) => s.movies[userId])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userId])
  const watchedSeries   = useWatchedStore((s) => s.seriesData[userId])
  const userRatings     = useRatingsStore((s) => s.ratings[userId])
  const watchlistMovies = useWatchlistStore((s) => s.movies[userId])
  const watchlistSeries = useWatchlistStore((s) => s.series[userId])

  const movieDefaultMode  = Object.keys(watchedMovies   ?? {}).length > 0 ? 'user' : 'global'
  const seriesDefaultMode = Object.keys(watchedEpisodes ?? {}).length > 0 ? 'user' : 'global'

  const userMovieGenres   = useUserMovieGenres()
  const globalMovieGenres = useGlobalMovieGenres()
  const userSeriesGenres  = useUserSeriesGenres()
  const globalSeriesGenres = useGlobalSeriesGenres()

  const movieReleases  = useMovieReleases(calendar.year, calendar.month)
  const seriesReleases = useSeriesReleases(calendar.year, calendar.month)

  const globalMovieTop10  = useGlobalMovieTop10(tmdbLang)
  const globalSeriesTop10 = useGlobalSeriesTop10(tmdbLang)
  const userMoviePool   = useMemo(
    () => buildUserMoviePool(watchedMovies, userRatings?.movies),
    [watchedMovies, userRatings]
  )
  const userSeriesPool  = useMemo(
    () => buildUserSeriesPool(watchedSeries, watchedEpisodes, userRatings?.series),
    [watchedSeries, watchedEpisodes, userRatings]
  )
  const userMovieTop10Query  = useUserMovieTop10(userMoviePool, tmdbLang)
  const userSeriesTop10Query = useUserSeriesTop10(userSeriesPool, tmdbLang)
  const userMovieTop10  = userMovieTop10Query.data  ?? userMoviePool.slice(0, 10)
  const userSeriesTop10 = userSeriesTop10Query.data ?? userSeriesPool.slice(0, 10)
  const top10DefaultMode = useMemo(() => (
    Object.keys(userRatings?.movies ?? {}).length > 0 ||
    Object.keys(userRatings?.series ?? {}).length > 0
  ) ? 'user' : 'global', [userRatings])

  const genreMap = useMemo(() => buildGenreMapForLanguage(language), [language])

  const watchlistMovieIds = useMemo(
    () => new Set(Object.keys(watchlistMovies ?? {}).map(Number)),
    [watchlistMovies]
  )
  const watchlistSeriesIds = useMemo(
    () => new Set(Object.keys(watchlistSeries ?? {}).map(Number)),
    [watchlistSeries]
  )

  const isGenreMovies = genreTab === 'movies'
  const calendarQuery = calendarTab === 'movies' ? movieReleases : seriesReleases

  const handlePrevMonth = () => {
    setCalendarDir('left')
    setCalendar((c) => c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 })
  }

  const handleNextMonth = () => {
    setCalendarDir('right')
    setCalendar((c) => c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 })
  }

  const handleToday = () => {
    setCalendarDir(null)
    const now = new Date()
    setCalendar({ year: now.getFullYear(), month: now.getMonth() + 1 })
  }

  const handleCalendarTabChange = (tab: typeof calendarTab) => {
    setCalendarDir(null)
    setCalendarTab(tab)
  }
  const handleEntryClick = (id: number) => {
    if (calendarTab === 'movies') setSelectedMovieId(id)
    else setSelectedSeriesId(id)
  }

  const handleTop10Click = (type: 'movie' | 'series', id: number) => {
    if (type === 'movie') setSelectedMovieId(id)
    else setSelectedSeriesId(id)
  }

  return (
    <PageLayout title={t('nav.home')} start={<HomeIcon size={32} strokeWidth={1.5} />}>
      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-[50vh] lg:auto-rows-[calc(50vh-3.5rem)]">
        {/* Top 10 card */}
        <Top10Card
          tab={top10Tab}
          onTabChange={setTop10Tab}
          globalMovieQuery={globalMovieTop10}
          globalSeriesQuery={globalSeriesTop10}
          userMovieItems={userMovieTop10}
          userSeriesItems={userSeriesTop10}
          userMoviePool={userMoviePool}
          userSeriesPool={userSeriesPool}
          defaultMode={top10DefaultMode}
          showUserToggle={role !== 'admin'}
          onItemClick={handleTop10Click}
          className="animate-fade-in"
        />

        {/* Calendar card */}
        <ReleaseCalendar
          key={`${calendar.year}-${calendar.month}-${calendarTab}`}
          year={calendar.year}
          month={calendar.month}
          tab={calendarTab}
          onTabChange={handleCalendarTabChange}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          query={calendarQuery}
          genreMap={genreMap}
          watchlistMovieIds={role !== 'admin' ? watchlistMovieIds : undefined}
          watchlistSeriesIds={role !== 'admin' ? watchlistSeriesIds : undefined}
          onEntryClick={handleEntryClick}
          animateFrom={calendarDir ?? undefined}
        />

        {/* Stats card */}
        <StatsCard className="animate-fade-in" />

        {/* Genres card */}
        <DonutChart
          key={genreTab}
          title={t('dashboard.genres')}
          tooltipLabel={isGenreMovies ? t('dashboard.chart.movies') : t('dashboard.chart.series')}
          tab={genreTab}
          onTabChange={setGenreTab}
          userQuery={isGenreMovies ? userMovieGenres : userSeriesGenres}
          globalQuery={isGenreMovies ? globalMovieGenres : globalSeriesGenres}
          defaultMode={isGenreMovies ? movieDefaultMode : seriesDefaultMode}
          showUserToggle={role !== 'admin'}
          getRowIcon={getGenreIconByName}
          className="animate-fade-in"
        />
      </div>
      </div>

      {selectedMovieId !== null && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
      {selectedSeriesId !== null && (
        <SeriesDetailModal seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />
      )}
    </PageLayout>
  )
}
