'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useLanguageStore } from '@/store/languageStore'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '@/components/icons'
import ContentTabToggle, { type ContentTab } from '@/components/ui/ContentTabToggle'
import Text from '@/components/ui/Text'
import MoviePoster from '@/components/common/MediaPoster'
import Tooltip from '@/components/ui/Tooltip'
import TrailerPlayer from '@/components/ui/TrailerPlayer'
import { getStatusConfig } from '@/features/series/getSeriesUI'
import { getGenreIcon } from '@/config/genreIcons'
import { fetchMovieVideos } from '@/features/movies/movies.service'
import { fetchSeriesVideos, fetchSeasonVideos } from '@/features/series/series.service'
import { useTrailer } from '@/hooks/useTrailer'
import type { ReleaseEntry } from '@/services/tmdb/releases'


type Props = {
  year: number
  month: number // 1-12
  tab: ContentTab
  onTabChange: (tab: ContentTab) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  query: { data?: ReleaseEntry[]; isLoading: boolean; isError: boolean }
  genreMap?: Record<number, string>
  onEntryClick?: (id: number) => void
  className?: string
}

const WEEKDAY_NAMES: Record<string, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'],
}

const DEFAULT_GENRE_MAP: Record<number, string> = {}

type ItemProps = {
  release: ReleaseEntry
  genreMap: Record<number, string>
  onEntryClick?: (id: number) => void
  language: string
}

function CalendarReleaseItem({ release, genreMap, onEntryClick, language }: ItemProps) {
  const { t } = useTranslation()
  const [showTrailer, setShowTrailer] = useState(false)
  const trailerRef = useRef<HTMLDivElement>(null)

  const isSeries = release.season_number != null

  const { trailer: seasonTrailer } = useTrailer(
    ['season-trailer', release.id, release.season_number ?? 0],
    () => fetchSeasonVideos(release.id, release.season_number!),
    isSeries,
    language,
  )
  const { trailer: seriesFallbackTrailer } = useTrailer(
    ['series-trailer', release.id],
    () => fetchSeriesVideos(release.id),
    isSeries,
    language,
  )
  const { trailer: movieTrailer } = useTrailer(
    ['movie-trailer', release.id],
    () => fetchMovieVideos(release.id),
    !isSeries,
    language,
  )

  const trailer = isSeries ? (seasonTrailer ?? seriesFallbackTrailer) : movieTrailer

  useEffect(() => {
    if (showTrailer && trailerRef.current) {
      trailerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showTrailer])

  const genres = (release.genre_ids ?? [])
    .slice(0, 2)
    .map((id) => ({ id, name: genreMap[id] }))
    .filter((g): g is { id: number; name: string } => Boolean(g.name))

  const statusConfig = release.series_status ? getStatusConfig(release.series_status) : null

  return (
    <div className={clsx('rounded-lg -mx-1 transition-colors', showTrailer && 'bg-cream-300 dark:bg-gray-700/60')}>
      <div
        onClick={() => onEntryClick?.(release.id)}
        className="flex items-center gap-3 py-2.5 w-full text-left px-1 cursor-pointer hover:bg-cream-400 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
      >
        <MoviePoster posterPath={release.poster_path} title={release.title} variant="list" loading="eager" />
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-caption font-semibold uppercase tracking-[0.14em] text-primary leading-snug line-clamp-2">
                {release.title}
              </span>
              {release.season_number != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {t('calendar.season', { number: release.season_number })}
                    {release.episode_count != null && ` · ${t('calendar.episodes', { count: release.episode_count })}`}
                  </span>
                  {statusConfig && (
                    <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full border leading-none ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}>
                      {t(statusConfig.labelKey)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {genres.map(({ id, name }) => {
                    const Icon = getGenreIcon(id)
                    return (
                      <span key={id} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50 whitespace-nowrap flex items-center gap-1">
                        {Icon && <Icon size={11} strokeWidth={1.5} />}
                        {name}
                      </span>
                    )
                  })}
                </div>
              )}
              {trailer && (
                <Tooltip content={t('common.trailer')} placement="top">
                  <button
                    data-cy="trailer-button"
                    onClick={(e) => { e.stopPropagation(); setShowTrailer((v) => !v) }}
                    className={clsx(
                      'shrink-0 w-7 h-7 flex items-center justify-center rounded border transition-colors cursor-pointer',
                      showTrailer
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5',
                    )}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M3 2l7 4-7 4V2z" />
                    </svg>
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
          <Text variant="small" className={release.overview ? 'text-foreground leading-relaxed line-clamp-3' : 'text-muted-foreground italic'}>
            {release.overview ?? t('calendar.noOverview')}
          </Text>
        </div>
      </div>
      {showTrailer && trailer && (
        <div ref={trailerRef} className="px-4 py-3 border-t border-border/30 flex justify-center">
          <TrailerPlayer trailerKey={trailer.key} className="w-full max-w-xs aspect-video border border-border rounded-lg overflow-hidden" onClose={() => setShowTrailer(false)} />
        </div>
      )}
    </div>
  )
}

export default function ReleaseCalendar({ year, month, tab, onTabChange, onPrevMonth, onNextMonth, onToday, query, genreMap = DEFAULT_GENRE_MAP, onEntryClick, className = '' }: Props) {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const locale   = language === 'en' ? 'en-US' : 'es-ES'
  const weekdays = WEEKDAY_NAMES[language] ?? WEEKDAY_NAMES.en

  const now      = new Date()
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null

  const monthName = useMemo(() => {
    const raw = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month - 1, 1))
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [year, month, locale])

  const releaseDays = useMemo(() => {
    const map = new Map<number, number>()
    if (!query.data) return map
    for (const item of query.data) {
      if (!item.date) continue
      const [y, m, d] = item.date.split('-').map(Number)
      if (y === year && m === month) map.set(d, (map.get(d) ?? 0) + 1)
    }
    return map
  }, [query.data, year, month])

  const { cells, rows } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDow    = new Date(year, month - 1, 1).getDay()
    const offset      = firstDow === 0 ? 6 : firstDow - 1
    const cs: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    while (cs.length % 7 !== 0) cs.push(null)
    return { cells: cs, rows: cs.length / 7 }
  }, [year, month])

  const selectedReleases = useMemo<ReleaseEntry[]>(() => {
    if (selectedDay === null || !query.data) return []
    const seen = new Set<number>()
    return query.data.filter((item) => {
      if (!item.date) return false
      const [y, m, d] = item.date.split('-').map(Number)
      if (!(y === year && m === month && d === selectedDay)) return false
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [selectedDay, query.data, year, month])

  const selectedDateLabel = selectedDay !== null
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(year, month - 1, selectedDay))
    : ''

  const showingReleases = selectedDay !== null

  return (
    <div className={`flex flex-col flex-1 gap-2 rounded-xl border border-border bg-card p-3 select-none${className ? ` ${className}` : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Text variant="body" className="font-semibold text-foreground">
            {t('calendar.title')}
          </Text>
          <ContentTabToggle tab={tab} onTabChange={(t) => { onTabChange(t); setSelectedDay(null) }} />
        </div>

        <div className="flex items-center gap-2">

          {showingReleases ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{selectedDateLabel}</span>
              <button
                data-cy="calendar-close"
                onClick={() => setSelectedDay(null)}
                className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
              >
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              {todayDay === null && (
              <button
                onClick={onToday}
                className="text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded-md transition-colors mr-1 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
              >
                {t('calendar.today')}
              </button>
            )}
            <button
              onClick={onPrevMonth}
              className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <ChevronLeftIcon size={14} />
            </button>
            <span className="text-xs font-semibold text-foreground min-w-28 text-center">
              {monthName} {year}
            </span>
            <button
              onClick={onNextMonth}
              className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
            >
                <ChevronRightIcon size={14} />
            </button>
            </div>
          )}
        </div>
      </div>

      {/* Content area — relative so the releases panel can overlay the calendar */}
      <div className="relative flex flex-col gap-2 flex-1">

        {/* Calendar (always mounted to preserve height; invisible when releases are shown) */}
        <div className={`flex flex-col gap-2 flex-1${showingReleases ? ' invisible' : ''}`}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7">
            {weekdays.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          {query.isLoading ? (
            <div className="grid grid-cols-7 gap-0.5 flex-1" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
              {cells.map((_, i) => (
                <div key={i} className="rounded-md bg-border animate-pulse" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="flex flex-1 items-center justify-center">
              <Text variant="small" className="text-muted-foreground">{t('calendar.error')}</Text>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5 flex-1" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
              {cells.map((day, i) => {
                const count      = day !== null ? (releaseDays.get(day) ?? 0) : 0
                const hasRelease = count > 0
                const isToday    = day !== null && day === todayDay

                let cellClass = 'flex flex-col items-center justify-center rounded-md text-xs transition-colors h-full outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset leading-none gap-[2px]'

                if (day === null) {
                  cellClass += ' cursor-default pointer-events-none'
                } else if (hasRelease && isToday) {
                  cellClass += ' bg-primary/15 dark:bg-primary/35 text-primary font-semibold ring-[1.5px] ring-inset ring-primary cursor-pointer'
                } else if (hasRelease) {
                  cellClass += ' bg-primary/15 dark:bg-primary/35 text-foreground font-medium hover:bg-primary/25 dark:hover:bg-primary/45 cursor-pointer'
                } else if (isToday) {
                  cellClass += ' text-primary font-semibold ring-[1.5px] ring-inset ring-primary hover:bg-muted/40'
                } else {
                  cellClass += ' text-muted-foreground hover:bg-muted/40'
                }

                return (
                  <button
                    key={i}
                    disabled={day === null || !hasRelease}
                    onClick={() => day !== null && hasRelease && setSelectedDay(day)}
                    className={cellClass}
                  >
                    {day !== null && (
                      <>
                        <span>{day}</span>
                        {hasRelease && (
                          <span className="w-4 h-0.75 rounded-full bg-primary opacity-70" />
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Releases panel — overlays the calendar, same bounding box */}
        {showingReleases && (
          <div key={selectedDay} className="absolute inset-0 overflow-y-auto">
            {selectedReleases.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Text variant="small" className="text-muted-foreground text-center">{t('calendar.empty')}</Text>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {selectedReleases.map((release) => (
                  <CalendarReleaseItem
                    key={`${release.id}-${release.title}`}
                    release={release}
                    genreMap={genreMap}
                    onEntryClick={onEntryClick}
                    language={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
