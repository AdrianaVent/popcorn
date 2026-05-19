'use client'

import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import MediaPoster from '@/components/common/MediaPoster'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import { useTruncated } from '@/hooks/useTruncated'
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
  const { ref: titleRef, isTruncated } = useTruncated(series.name)

  return (
    <div className="flex flex-col gap-2 group">
      <button
        onClick={onClick}
        className="relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MediaPoster
          posterPath={series.poster_path}
          title={series.name}
          variant="fluid"
          loading={eager ? 'eager' : 'lazy'}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />

        {/* Watching band — diagonal ribbon for in-progress series */}
        {!completed && (
          <div className="absolute top-3 -left-6 w-24 py-0.5 rotate-[-35deg] bg-primary text-primary-foreground text-[9px] font-semibold uppercase tracking-wider text-center shadow-sm">
            {t('myList.watching')}
          </div>
        )}
      </button>

      <div className="flex flex-col gap-1 px-0.5 items-center w-full">
        <Tooltip content={series.name} disabled={!isTruncated} placement="bottom" className="w-full">
          <p ref={titleRef} className="text-[13px] font-medium text-foreground leading-tight truncate w-full text-center">
            {series.name}
          </p>
        </Tooltip>
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
      </div>
    </div>
  )
}
