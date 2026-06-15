'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Rocket, Heart, BookOpen, Sparkles, Smile, Compass,
  Zap, Crosshair, GraduationCap, Ghost, Search, Gift,
  type LucideIcon,
} from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import MediaPoster from '@/components/common/MediaPoster'
import { SEASONAL_CONFIG } from '@/config/seasonal'
import { useSeasonalRecommendations } from '@/features/home/hooks/useSeasonalRecommendations'
import type { TMDBMovie, TMDBSeries } from '@/types/tmdb'

const MONTH_ICONS: Record<number, LucideIcon> = {
  1: Rocket, 2: Heart, 3: BookOpen, 4: Sparkles, 5: Smile, 6: Compass,
  7: Zap, 8: Crosshair, 9: GraduationCap, 10: Ghost, 11: Search, 12: Gift,
}

type Props = {
  month: number
  onMovieClick?: (id: number) => void
  onSeriesClick?: (id: number) => void
  className?: string
}

function ItemRow({ title, dateStr, posterPath, voteAverage, onClick }: {
  title: string
  dateStr: string
  posterPath: string | null
  voteAverage: number
  onClick: () => void
}) {
  const year = dateStr?.slice(0, 4)
  const rating = voteAverage > 0 ? (voteAverage / 2).toFixed(1) : null

  return (
    <button
      onClick={onClick}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
      className="flex items-center gap-2 w-full text-left rounded-md px-1 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary shrink-0"
    >
      <MediaPoster posterPath={posterPath} title={title} variant="sm" loading="lazy" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground truncate leading-tight">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {year}{rating && <span> · <span aria-hidden="true">★</span> {rating}</span>}
        </p>
      </div>
    </button>
  )
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-1 py-1 animate-pulse">
          <div className="w-9 h-14 rounded bg-muted shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2 bg-muted rounded w-4/5" />
            <div className="h-2 bg-muted rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

type ColumnItem = { id: number; title: string; dateStr: string; posterPath: string | null; voteAverage: number }

function SeasonalColumn({ label, items, isLoading, onItemClick }: {
  label: string
  items: ColumnItem[]
  isLoading: boolean
  onItemClick: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {label}
      </p>
      {isLoading ? <SectionSkeleton /> : (
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              title={item.title}
              dateStr={item.dateStr}
              posterPath={item.posterPath}
              voteAverage={item.voteAverage}
              onClick={() => onItemClick(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SeasonalPanel({ month, onMovieClick, onSeriesClick, className = '' }: Props) {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const userId = useUserStore((s) => s.userId) ?? ''

  const watchedMovies = useWatchedStore((s) => s.movies[userId])
  const watchedSeries = useWatchedStore((s) => s.seriesData[userId])

  const watchedMovieIds = useMemo(
    () => new Set(Object.keys(watchedMovies ?? {}).map(Number)),
    [watchedMovies],
  )
  const watchedSeriesIds = useMemo(
    () => new Set(Object.keys(watchedSeries ?? {}).map(Number)),
    [watchedSeries],
  )

  const config = SEASONAL_CONFIG[month]
  const MonthIcon = MONTH_ICONS[month]
  const { movies: rawMovies, series: rawSeries, isLoading } = useSeasonalRecommendations(month, language)

  const movies = useMemo(
    () => rawMovies
      .filter((m) => !watchedMovieIds.has(m.id))
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 10),
    [rawMovies, watchedMovieIds],
  )
  const series = useMemo(
    () => rawSeries
      .filter((s) => !watchedSeriesIds.has(s.id))
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 10),
    [rawSeries, watchedSeriesIds],
  )

  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const monthName = useMemo(() => {
    const raw = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, month - 1, 1))
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [month, locale])

  return (
    <div role="region" aria-label={t('seasonal.panelTitle')} className={`flex flex-col h-full overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0 pb-2 border-b border-border">
        <MonthIcon size={16} aria-hidden="true" className="text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight">{monthName}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{t(config.themeKey)}</p>
        </div>
      </div>

      <div aria-busy={isLoading} className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto">

        <SeasonalColumn
          label={t('nav.movies')}
          isLoading={isLoading}
          items={movies.map((m: TMDBMovie) => ({
            id: m.id, title: m.title, dateStr: m.release_date,
            posterPath: m.poster_path, voteAverage: m.vote_average,
          }))}
          onItemClick={(id) => onMovieClick?.(id)}
        />
        <SeasonalColumn
          label={t('nav.series')}
          isLoading={isLoading}
          items={series.map((s: TMDBSeries) => ({
            id: s.id, title: s.name, dateStr: s.first_air_date,
            posterPath: s.poster_path, voteAverage: s.vote_average,
          }))}
          onItemClick={(id) => onSeriesClick?.(id)}
        />

      </div>
    </div>
  )
}
