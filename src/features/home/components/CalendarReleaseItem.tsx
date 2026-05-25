'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import MoviePoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import TrailerPlayer from '@/components/ui/TrailerPlayer'
import { getStatusConfig } from '@/features/series/getSeriesUI'
import { getGenreIcon } from '@/config/genreIcons'
import { fetchMovieVideos } from '@/features/movies/movies.service'
import { fetchSeriesVideos, fetchSeasonVideos } from '@/features/series/series.service'
import { useTrailer } from '@/hooks/useTrailer'
import type { ReleaseEntry } from '@/services/tmdb/releases'

type Props = {
  release: ReleaseEntry
  genreMap: Record<number, string>
  onEntryClick?: (id: number) => void
  language: string
}

export default function CalendarReleaseItem({ release, genreMap, onEntryClick, language }: Props) {
  const { t } = useTranslation()
  const [showTrailer, setShowTrailer] = useState(false)
  const trailerRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

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
    <div ref={itemRef} className={clsx('rounded-lg -mx-1 transition-colors', showTrailer && 'bg-cream-300 dark:bg-gray-700/60')}>
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
