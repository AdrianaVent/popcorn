'use client'

import { useTranslation } from 'react-i18next'
import MediaCard from '@/components/common/MediaCard'
import { HeartIcon } from '@/components/icons'

type Props = {
  posterPath: string | null
  title: string
  year: number | null
  onClick: () => void
  onRemove: () => void
  eager?: boolean
}

export default function WatchlistCard({ posterPath, title, year, onClick, onRemove, eager = false }: Props) {
  const { t } = useTranslation()
  return (
    <MediaCard posterPath={posterPath} title={title} onClick={onClick} eager={eager} variant="md">
      {year && <p className="text-[11px] text-muted-foreground">{year}</p>}
      <button
        data-cy="watchlist-remove"
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        aria-label={t('myList.watchlist.remove')}
        className="flex items-center justify-center text-primary hover:text-primary/70 transition-colors cursor-pointer"
      >
        <span aria-hidden="true"><HeartIcon size={14} filled /></span>
      </button>
    </MediaCard>
  )
}
