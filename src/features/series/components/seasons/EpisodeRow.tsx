'use client'

import clsx from 'clsx'
import WatchedEpisodeButton from './WatchedEpisodeButton'
import { useWatchedStore } from '@/store/watchedStore'
import type { StoredSeries } from '@/store/watchedStore'
import type { TMDBEpisode } from '@/types/tmdb'

type Props = {
  episode: TMDBEpisode
  seriesId: number
  userId: string
  seasonNumber: number
  seriesSnapshot?: StoredSeries
  canWatch: boolean
}

export default function EpisodeRow({ episode, seriesId, userId, seasonNumber, seriesSnapshot, canWatch }: Props) {
  const watched = useWatchedStore((s) => !!s.episodes[userId]?.[seriesId]?.[episode.id])
  const num = String(episode.episode_number).padStart(2, '0')

  return (
    <div className={clsx(
      'flex items-center gap-2 px-4 py-1.5 transition-colors',
      canWatch && watched ? 'bg-primary/5' : 'hover:bg-cream-300 dark:hover:bg-gray-700/60'
    )}>
      <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-7">E{num}</span>
      <span className={clsx(
        'text-[12px] truncate flex-1 min-w-0 transition-colors',
        canWatch && watched ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground'
      )}>
        {episode.name}
      </span>
      {episode.runtime != null && (
        <span className="text-[11px] text-muted-foreground shrink-0">{episode.runtime} min</span>
      )}
      {canWatch && episode.runtime != null && (
        <WatchedEpisodeButton
          episodeId={episode.id}
          seriesId={seriesId}
          userId={userId}
          seasonNumber={seasonNumber}
          seriesSnapshot={seriesSnapshot}
        />
      )}
    </div>
  )
}
