'use client'

import { useTranslation } from 'react-i18next'
import Tooltip from '@/components/ui/Tooltip'
import IconToggleButton from '@/components/ui/IconToggleButton'
import MediaPoster from '@/components/common/MediaPoster'
import { HeartIcon } from '@/components/icons'
import { useTruncated } from '@/hooks/useTruncated'
import { getGenreIcon } from '@/config/genreIcons'
import { useReleaseWatchlistToggle } from '@/features/home/hooks/useReleaseWatchlistToggle'
import type { ReleaseEntry } from '@/services/tmdb/releases'

type Props = {
  release: ReleaseEntry
  onEntryClick?: (id: number) => void
}

export default function ReminderItem({ release, onEntryClick }: Props) {
  const { t } = useTranslation()
  const { isWatched, isInWatchlist, handleToggleWatchlist, role } = useReleaseWatchlistToggle(release)

  const { ref: titleRef, isTruncated } = useTruncated<HTMLSpanElement>(release.title)

  const genreIcons = [...new Set(
    (release.genre_ids ?? [])
      .map((id) => getGenreIcon(id))
      .filter((Icon): Icon is NonNullable<typeof Icon> => Icon !== null),
  )].slice(0, 3)

  const isSeries = release.season_number != null
  const seasonLabel = isSeries
    ? [
        t('calendar.season', { number: release.season_number }),
        release.episode_count != null ? t('calendar.episodes', { count: release.episode_count }) : null,
      ].filter(Boolean).join(' · ')
    : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEntryClick?.(release.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEntryClick?.(release.id) } }}
      className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-cream-400 dark:hover:bg-gray-700/60 hc:hover:bg-muted rounded-lg transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
    >
      <MediaPoster posterPath={release.poster_path} title={release.title} variant="sm" loading="eager" />

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <Tooltip content={release.title} placement="top" disabled={!isTruncated}>
          <span ref={titleRef} className="block truncate text-[11px] font-semibold text-foreground leading-snug">
            {release.title}
          </span>
        </Tooltip>
        <div className="flex items-center gap-1.5">
          {genreIcons.map((Icon, i) => (
            <span key={i} aria-hidden="true" className="text-muted-foreground shrink-0">
              <Icon size={10} strokeWidth={1.5} />
            </span>
          ))}
          {seasonLabel && (
            <span className="text-[10px] text-muted-foreground truncate">{seasonLabel}</span>
          )}
        </div>
      </div>

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
            <span aria-hidden="true"><HeartIcon size={11} filled={isInWatchlist} /></span>
          </IconToggleButton>
        </Tooltip>
      )}
    </div>
  )
}
