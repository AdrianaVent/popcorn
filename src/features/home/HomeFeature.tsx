'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import BarChart from '@/components/ui/BarChart'
import ReleaseCalendar from '@/features/home/components/ReleaseCalendar'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import { useUserMovieGenres, useGlobalMovieGenres } from '@/features/home/hooks/useMovieGenres'
import { useUserSeriesGenres, useGlobalSeriesGenres } from '@/features/home/hooks/useSeriesGenres'
import { useMovieReleases, useSeriesReleases } from '@/features/home/hooks/useReleases'
import { useGlobalMovieTop10, useGlobalSeriesTop10, buildUserMovieTop10, buildUserSeriesTop10 } from '@/features/home/hooks/useTop10'
import Top10Card from '@/features/home/components/Top10Card'
import HomeCard from '@/features/home/components/HomeCard'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { genresService } from '@/services/tmdb/genres'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { resolveSeriesGenreName } from '@/features/series/getSeriesUI'
import PageLayout from '@/components/layouts/PageLayout'
import { HomeIcon } from '@/components/icons'

type ContentTab = 'movies' | 'series'

const EMPTY_GENRE_MAP: Record<number, string> = {}

const TABS = [
  { value: 'movies' as ContentTab, labelKey: 'nav.movies' },
  { value: 'series' as ContentTab, labelKey: 'nav.series' },
]

export default function HomeFeature() {
  const { t } = useTranslation()
  const [genreTab, setGenreTab]       = useState<ContentTab>('movies')
  const [top10Tab, setTop10Tab]       = useState<ContentTab>('movies')
  const [calendarTab, setCalendarTab] = useState<ContentTab>('movies')
  const [calendar, setCalendar]       = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
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
  const userMovieTop10  = useMemo(
    () => buildUserMovieTop10(watchedMovies, userRatings?.movies),
    [watchedMovies, userRatings]
  )
  const userSeriesTop10 = useMemo(
    () => buildUserSeriesTop10(watchedSeries, watchedEpisodes, userRatings?.series),
    [watchedSeries, watchedEpisodes, userRatings]
  )
  const top10DefaultMode = useMemo(() => (
    Object.keys(userRatings?.movies ?? {}).length > 0 ||
    Object.keys(userRatings?.series ?? {}).length > 0
  ) ? 'user' : 'global', [userRatings])

  const { data: movieGenreMap } = useQuery({
    queryKey: ['genre-map-movie', tmdbLang],
    queryFn: () => genresService.movieList(tmdbLang).then((r) =>
      Object.fromEntries(r.genres.map((g) => [g.id, g.name]))
    ),
    staleTime: Infinity,
  })
  const { data: seriesGenreMap } = useQuery({
    queryKey: ['genre-map-series', tmdbLang, language],
    queryFn: () => genresService.seriesList(tmdbLang).then((r) =>
      Object.fromEntries(r.genres.map((g) => [g.id, resolveSeriesGenreName(g.id, g.name, language)]))
    ),
    staleTime: Infinity,
  })

  const isGenreMovies  = genreTab === 'movies'
  const calendarQuery  = calendarTab === 'movies' ? movieReleases : seriesReleases
  const calendarGenres = calendarTab === 'movies' ? (movieGenreMap ?? EMPTY_GENRE_MAP) : (seriesGenreMap ?? EMPTY_GENRE_MAP)

  const handlePrevMonth = () =>
    setCalendar((c) => c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 })

  const handleNextMonth = () =>
    setCalendar((c) => c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 })

  const handleToday = () => {
    const now = new Date()
    setCalendar({ year: now.getFullYear(), month: now.getMonth() + 1 })
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
      <div className="flex-1 min-h-0 overflow-y-auto 2xl:overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 auto-rows-[60vh] 2xl:h-full 2xl:auto-rows-[1fr]">
        {/* Top 10 card */}
        <HomeCard tabs={TABS} activeTab={top10Tab} onTabChange={setTop10Tab}>
          <Top10Card
            tab={top10Tab}
            globalMovieQuery={globalMovieTop10}
            globalSeriesQuery={globalSeriesTop10}
            userMovieItems={userMovieTop10}
            userSeriesItems={userSeriesTop10}
            defaultMode={top10DefaultMode}
            showUserToggle={role !== 'admin'}
            onItemClick={handleTop10Click}
          />
        </HomeCard>

        {/* Calendar card */}
        <HomeCard tabs={TABS} activeTab={calendarTab} onTabChange={setCalendarTab}>
          <ReleaseCalendar
            key={`${calendar.year}-${calendar.month}-${calendarTab}`}
            year={calendar.year}
            month={calendar.month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            query={calendarQuery}
            genreMap={calendarGenres}
            onEntryClick={handleEntryClick}
          />
        </HomeCard>

        {/* Genres card */}
        <HomeCard tabs={TABS} activeTab={genreTab} onTabChange={setGenreTab}>
          <BarChart
            key={genreTab}
            title={t('dashboard.genres')}
            orientation="horizontal"
            tooltipLabel={isGenreMovies ? t('dashboard.chart.movies') : t('dashboard.chart.series')}
            userQuery={isGenreMovies ? userMovieGenres : userSeriesGenres}
            globalQuery={isGenreMovies ? globalMovieGenres : globalSeriesGenres}
            defaultMode={isGenreMovies ? movieDefaultMode : seriesDefaultMode}
            showUserToggle={role !== 'admin'}
          />
        </HomeCard>
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
