'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import MoviePoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import TrailerPlayer from '@/components/ui/TrailerPlayer'
import IconToggleButton from '@/components/ui/IconToggleButton'
import { getStatusConfig } from '@/features/series/getSeriesUI'
import { getGenreIcon } from '@/config/genreIcons'
import { fetchMovieVideos } from '@/features/movies/movies.service'
import { fetchSeriesVideos, fetchSeasonVideos } from '@/features/series/series.service'
import { useTrailer } from '@/hooks/useTrailer'
import { useReleaseWatchlistToggle } from '@/features/home/hooks/useReleaseWatchlistToggle'
import { HeartIcon } from '@/components/icons'
import type { ReleaseEntry } from '@/services/tmdb/releases'

type Props = {
  release: ReleaseEntry
  genreMap: Record<number, string>
  onEntryClick?: (id: number) => void
  language: string
  compact?: boolean
}

export default function CalendarReleaseItem({ release, genreMap, onEntryClick, language, compact = false }: Props) {
  const { t } = useTranslation()
  const [showTrailer, setShowTrailer] = useState(false)
  const trailerRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  const isSeries = release.season_number != null
  const { isWatched, isInWatchlist, handleToggleWatchlist, role } = useReleaseWatchlistToggle(release)

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
    <div ref={itemRef} className={clsx('rounded-lg -mx-1 transition-colors', showTrailer && 'bg-cream-300 dark:bg-gray-700/60 hc:bg-card')}>
      <div
        tabIndex={0}
        onClick={() => onEntryClick?.(release.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEntryClick?.(release.id) } }}
        className="flex items-center gap-3 py-2.5 w-full text-left px-1 cursor-pointer hover:bg-cream-400 dark:hover:bg-gray-700/60 hc:hover:bg-muted rounded-lg transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <MoviePoster posterPath={release.poster_path} title={release.title} variant="list" loading="eager" />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-caption font-semibold uppercase tracking-[0.14em] text-primary leading-snug truncate">
            {release.title}
          </span>
          <div className={`flex gap-2 ${compact ? 'items-center' : 'items-center justify-between'}`}>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {release.season_number != null && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {t('calendar.season', { number: release.season_number })}
                    {release.episode_count != null && ` · ${t('calendar.episodes', { count: release.episode_count })}`}
                  </span>
                  {statusConfig && (
                    <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full border leading-none shrink-0 ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}>
                      {t(statusConfig.labelKey)}
                    </span>
                  )}
                </div>
              )}
              {genres.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  {genres.map(({ id, name }) => {
                    const Icon = getGenreIcon(id)
                    if (!Icon) return null
                    return (
                      <Tooltip key={id} content={name} placement="top">
                        <span aria-hidden="true" className="text-muted-foreground">
                          <Icon size={12} strokeWidth={1.5} />
                        </span>
                      </Tooltip>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!compact && trailer && (
                <Tooltip content={t('common.trailer')} placement="top">
                  <IconToggleButton
                    data-cy="trailer-button"
                    active={showTrailer}
                    aria-label={t('common.trailer')}
                    aria-pressed={showTrailer}
                    onClick={(e) => { e.stopPropagation(); setShowTrailer((v) => !v) }}
                    className="shrink-0"
                  >
                    <span aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3 2l7 4-7 4V2z" />
                      </svg>
                    </span>
                  </IconToggleButton>
                </Tooltip>
              )}
              {role !== 'admin' && !isWatched && (
                <Tooltip content={isInWatchlist ? t('myList.watchlist.remove') : t('myList.watchlist.add')} placement="top">
                  <IconToggleButton
                    data-cy="calendar-watchlist-toggle"
                    active={isInWatchlist}
                    aria-label={isInWatchlist ? t('myList.watchlist.remove') : t('myList.watchlist.add')}
                    aria-pressed={isInWatchlist}
                    onClick={handleToggleWatchlist}
                    className="shrink-0"
                  >
                    <span aria-hidden="true"><HeartIcon size={13} filled={isInWatchlist} /></span>
                  </IconToggleButton>
                </Tooltip>
              )}
            </div>
          </div>
          {!compact && (
            <Text variant="small" className={release.overview ? 'text-foreground leading-relaxed line-clamp-3' : 'text-muted-foreground italic'}>
              {release.overview ?? t('calendar.noOverview')}
            </Text>
          )}
        </div>
      </div>
      {showTrailer && trailer && (
        <div ref={trailerRef} className="px-4 py-3 border-t border-border/30 hc:border-border flex justify-center">
          <TrailerPlayer
            trailerKey={trailer.key}
            className="w-full max-w-xs aspect-video border border-border rounded-lg overflow-hidden"
            onClose={() => {
              setShowTrailer(false)
              requestAnimationFrame(() => {
                itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              })
            }}
          />
        </div>
      )}
    </div>
  )
}
