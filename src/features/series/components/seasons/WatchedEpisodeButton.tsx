'use client'

import clsx from 'clsx'
import { useWatchedStore } from '@/store/watchedStore'
import { EyeIcon, EyeSlashIcon } from '@/components/icons'
import type { StoredSeries } from '@/store/watchedStore'

type Props = {
  episodeId: number
  seriesId: number
  userId: string
  seasonNumber: number
  seriesSnapshot?: StoredSeries
}

export default function WatchedEpisodeButton({ episodeId, seriesId, userId, seasonNumber, seriesSnapshot }: Props) {
  const watched = useWatchedStore((s) => !!s.episodes[userId]?.[seriesId]?.[episodeId])
  const toggleEpisode = useWatchedStore((s) => s.toggleEpisode)

  return (
    <button
      data-cy="episode-watched-btn"
      onClick={(e) => { e.stopPropagation(); toggleEpisode(userId, seriesId, episodeId, seasonNumber, seriesSnapshot) }}
      className={clsx(
        'shrink-0 flex items-center justify-center transition-colors cursor-pointer',
        watched
          ? 'text-primary hover:opacity-70'
          : 'text-muted-foreground/40 hover:text-primary'
      )}
    >
      {watched ? <EyeIcon size={14} /> : <EyeSlashIcon size={14} />}
    </button>
  )
}
