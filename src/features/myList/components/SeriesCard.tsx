'use client'

import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import MediaCard from '@/components/common/MediaCard'
import StarRating from '@/components/ui/StarRating'
import type { StoredSeries } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'

type Props = {
  series: StoredSeries
  watchedEpisodes: number
  rating: Rating | null
  onRate: (rating: Rating) => void
  onClick: () => void
  eager?: boolean
}

export default function SeriesCard({ series, watchedEpisodes, rating, onRate, onClick, eager = false }: Props) {
  const { t } = useTranslation()
  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : null
  const total = series.number_of_episodes
  const completed = total > 0 && watchedEpisodes >= total

  const ribbon = !completed ? (
    <div className="absolute top-3 -left-6 w-24 py-0.5 rotate-[-35deg] bg-primary text-primary-foreground text-[9px] font-semibold uppercase tracking-wider text-center shadow-sm">
      {t('myList.watching')}
    </div>
  ) : undefined

  return (
    <MediaCard posterPath={series.poster_path} title={series.name} onClick={onClick} eager={eager} overlay={ribbon}>
      <div className="flex items-center gap-2">
        {year && (
          <p className="text-[11px] text-muted-foreground">{year}</p>
        )}
        {total > 0 && (
          <span className={clsx(
            'text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap',
            completed
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted border-border/50 text-muted-foreground'
          )}>
            {watchedEpisodes}/{total} ep.
          </span>
        )}
      </div>
      {completed ? (
        <>
          <StarRating value={rating} onChange={onRate} size={15} />
          {!rating && (
            <p className="text-[10px] text-muted-foreground/60 italic">
              {t('myList.rate')}
            </p>
          )}
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground/60 italic">
          {t('myList.finishToRate')}
        </p>
      )}
    </MediaCard>
  )
}
