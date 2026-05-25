'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import MediaPoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import TrailerPlayer from '@/components/ui/TrailerPlayer'
import EpisodeRow from './EpisodeRow'
import { fetchSeasonDetail, fetchSeasonVideos } from '@/features/series/series.service'
import { useTrailer } from '@/hooks/useTrailer'
import { useLanguageStore } from '@/store/languageStore'
import { useWatchedStore } from '@/store/watchedStore'
import type { StoredSeries } from '@/store/watchedStore'
import type { TMDBSeason, TMDBEpisode, TMDBVideo } from '@/types/tmdb'
import { EyeIcon, EyeSlashIcon } from '@/components/icons'

export type SeasonItemProps = {
  season: TMDBSeason
  seriesId: number
  isOpen: boolean
  onToggle: () => void
  userId: string
  seriesSnapshot?: StoredSeries
  canWatch: boolean
  seriesTrailerFallback?: TMDBVideo | null
}

export default function SeasonItem({ season, seriesId, isOpen, onToggle, userId, seriesSnapshot, canWatch, seriesTrailerFallback }: SeasonItemProps) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const [episodes, setEpisodes] = useState<TMDBEpisode[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [markLoading, setMarkLoading] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const trailerRef = useRef<HTMLDivElement>(null)

  const { trailer: seasonTrailer } = useTrailer(
    ['season-trailer', seriesId, season.season_number],
    () => fetchSeasonVideos(seriesId, season.season_number),
    true,
    language,
  )
  const trailer = seasonTrailer ?? seriesTrailerFallback ?? null

  useEffect(() => {
    if (showTrailer && trailerRef.current) {
      trailerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showTrailer])

  const markSeason = useWatchedStore((s) => s.markSeason)

  const watchedForSeason = useWatchedStore((s) => {
    const eps = s.episodes[userId]?.[seriesId]
    if (!eps) return 0
    return Object.values(eps).filter((ep) => ep.seasonNumber === season.season_number).length
  })

  const totalCount = season.episode_count
  const allWatched = totalCount > 0 && watchedForSeason >= totalCount
  const year = season.air_date ? new Date(season.air_date).getFullYear() : null

  const handleToggle = async () => {
    if (!isOpen && episodes === null) {
      setLoading(true)
      try {
        const detail = await fetchSeasonDetail(seriesId, season.season_number, language)
        setEpisodes(detail.episodes)
      } catch {
        setEpisodes([])
      } finally {
        setLoading(false)
      }
    }
    onToggle()
  }

  return (
    <div className={clsx(
      'border-b border-border/50 last:border-0 transition-colors',
      isOpen && 'border-l-2 border-primary bg-cream-300 dark:bg-gray-700'
    )}>
      <div className="flex items-center transition-colors hover:bg-cream-400 dark:hover:bg-gray-700">
        <button
          onClick={handleToggle}
          className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 text-left"
        >
          <MediaPoster posterPath={season.poster_path} title={season.name} variant="sm" />

          <div className="flex flex-col min-w-0 flex-1 gap-2">
            <Text
              variant="small"
              className={clsx('truncate font-medium', allWatched ? 'text-muted-foreground' : 'text-foreground')}
            >
              {season.name}
            </Text>

            <div className="flex items-center gap-4">
              {canWatch ? (
                <span className={clsx(
                  'text-[11px] px-1.5 py-0.5 rounded border whitespace-nowrap transition-colors',
                  allWatched
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted text-muted-foreground border-border/50'
                )}>
                  {watchedForSeason} / {totalCount} ep.
                </span>
              ) : (
                <span className="text-[11px] px-1.5 py-0.5 rounded border whitespace-nowrap bg-muted text-muted-foreground border-border/50">
                  {totalCount} ep.
                </span>
              )}

              {year && (
                <Text variant="caption" className="text-muted-foreground">{year}</Text>
              )}
            </div>
          </div>
        </button>

        {trailer && (
          <Tooltip content={t('common.trailer')} placement="top">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTrailer((v) => !v) }}
              className={clsx(
                'shrink-0 mr-3 w-7 h-7 flex items-center justify-center rounded border transition-colors cursor-pointer',
                showTrailer
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground/40 hover:border-primary/40 hover:text-primary',
              )}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 2l7 4-7 4V2z" />
              </svg>
            </button>
          </Tooltip>
        )}

        {canWatch && (
          <Tooltip content={allWatched ? t('series.detail.unmarkSeason') : t('series.detail.markSeasonWatched')} placement="top">
            <button
              data-cy="season-watched-btn"
              onClick={async () => {
                let eps = episodes
                if (eps === null) {
                  setMarkLoading(true)
                  try {
                    const detail = await fetchSeasonDetail(seriesId, season.season_number, language)
                    eps = detail.episodes
                    setEpisodes(eps)
                  } catch {
                    eps = []
                  } finally {
                    setMarkLoading(false)
                  }
                }
                const today = new Date().toISOString().slice(0, 10)
                const airedIds = eps.filter((ep) => ep.air_date && ep.air_date <= today && ep.runtime != null).map((ep) => ep.id)
                if (airedIds.length > 0) {
                  markSeason(userId, seriesId, season.season_number, airedIds, seriesSnapshot)
                }
              }}
              disabled={markLoading}
              className={clsx(
                'shrink-0 mr-4 flex items-center justify-center transition-colors cursor-pointer',
                markLoading && 'opacity-50 cursor-wait',
                allWatched
                  ? 'text-primary hover:opacity-70'
                  : 'text-muted-foreground/40 hover:text-primary'
              )}
            >
              {markLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" className="opacity-40" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : allWatched ? (
                <EyeIcon size={16} />
              ) : (
                <EyeSlashIcon size={16} />
              )}
            </button>
          </Tooltip>
        )}

        <button
          onClick={handleToggle}
          className="shrink-0 mr-4 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={clsx('transition-transform duration-200', isOpen && 'rotate-180')}
          >
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {trailer && showTrailer && (
        <div ref={trailerRef} className="px-4 py-3 border-t border-border/30 bg-cream-300 dark:bg-gray-700 flex justify-center">
          <TrailerPlayer trailerKey={trailer.key} className="w-full max-w-xs aspect-video border border-border rounded-lg overflow-hidden" onClose={() => setShowTrailer(false)} />
        </div>
      )}

      {isOpen && (
        <div className="border-t border-border/30">
          {loading && (
            <div className="flex flex-col gap-1 px-4 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 rounded bg-border/50 animate-pulse" />
              ))}
            </div>
          )}
          {!loading && episodes !== null && episodes.length === 0 && (
            <Text variant="caption" className="text-muted-foreground px-4 py-2">
              {t('series.detail.noEpisodes')}
            </Text>
          )}
          {!loading && episodes !== null && episodes.length > 0 && (
            <div className="py-1">
              {episodes.map((ep) => (
                <EpisodeRow
                  key={ep.id}
                  episode={ep}
                  seriesId={seriesId}
                  userId={userId}
                  seasonNumber={season.season_number}
                  seriesSnapshot={seriesSnapshot}
                  canWatch={canWatch}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
