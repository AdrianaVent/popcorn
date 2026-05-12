'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/ui/Header'
import BarChart from '@/components/ui/BarChart'
import ReleaseCalendar from '@/features/home/components/ReleaseCalendar'
import MovieDetailModal from '@/features/movies/components/MovieDetailModal'
import SeriesDetailModal from '@/features/series/components/SeriesDetailModal'
import { useUserMovieGenres, useGlobalMovieGenres } from '@/features/home/hooks/useMovieGenres'
import { useUserSeriesGenres, useGlobalSeriesGenres } from '@/features/home/hooks/useSeriesGenres'
import { useMovieReleases, useSeriesReleases } from '@/features/home/hooks/useReleases'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { genresService } from '@/services/tmdb/genres'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { resolveSeriesGenreName } from '@/features/series/getSeriesUI'

type ContentTab = 'movies' | 'series'

const EMPTY_GENRE_MAP: Record<number, string> = {}

const TABS: { value: ContentTab; labelKey: string }[] = [
  { value: 'movies', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.series' },
]

function TabBar({ activeTab, onSelect }: { activeTab: ContentTab; onSelect: (t: ContentTab) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex w-full items-end">
      <div className="flex-1 border-b border-border" />
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onSelect(tab.value)}
          className={[
            'px-5 py-2 text-sm font-medium border transition-colors -mb-px relative z-10 rounded-t-lg',
            activeTab === tab.value
              ? 'bg-card border-border text-foreground'
              : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground',
          ].join(' ')}
          style={activeTab === tab.value ? { borderBottomColor: 'var(--color-card)' } : {}}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}

export default function HomeFeature() {
  const { t } = useTranslation()
  const [genreTab, setGenreTab]       = useState<ContentTab>('movies')
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

  const movieDefaultMode  = Object.keys(watchedMovies   ?? {}).length > 0 ? 'user' : 'global'
  const seriesDefaultMode = Object.keys(watchedEpisodes ?? {}).length > 0 ? 'user' : 'global'

  const userMovieGenres   = useUserMovieGenres()
  const globalMovieGenres = useGlobalMovieGenres()
  const userSeriesGenres  = useUserSeriesGenres()
  const globalSeriesGenres = useGlobalSeriesGenres()

  const movieReleases  = useMovieReleases(calendar.year, calendar.month)
  const seriesReleases = useSeriesReleases(calendar.year, calendar.month)

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

  return (
    <div className="min-h-full flex flex-col gap-4 p-4 pb-10 xl:pb-4">
      <Header title={t('nav.home')} />

      <div className="flex flex-col xl:flex-row gap-4">
        {/* Genres card */}
        <div className="w-full xl:flex-1 flex flex-col">
          <TabBar activeTab={genreTab} onSelect={setGenreTab} />
          <BarChart
            key={genreTab}
            title={t('dashboard.genres')}
            orientation="horizontal"
            tooltipLabel={isGenreMovies ? t('dashboard.chart.movies') : t('dashboard.chart.series')}
            userQuery={isGenreMovies ? userMovieGenres : userSeriesGenres}
            globalQuery={isGenreMovies ? globalMovieGenres : globalSeriesGenres}
            defaultMode={isGenreMovies ? movieDefaultMode : seriesDefaultMode}
            showUserToggle={role !== 'admin'}
            className="rounded-tr-none"
          />
        </div>

        {/* Calendar card */}
        <div className="w-full xl:flex-1 flex flex-col">
          <TabBar activeTab={calendarTab} onSelect={setCalendarTab} />
          <ReleaseCalendar
            key={`${calendar.year}-${calendar.month}`}
            year={calendar.year}
            month={calendar.month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            query={calendarQuery}
            genreMap={calendarGenres}
            onEntryClick={handleEntryClick}
            className="rounded-tr-none"
          />
        </div>
      </div>

      {selectedMovieId !== null && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
      {selectedSeriesId !== null && (
        <SeriesDetailModal seriesId={selectedSeriesId} onClose={() => setSelectedSeriesId(null)} />
      )}
    </div>
  )
}
