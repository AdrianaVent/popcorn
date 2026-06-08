'use client'

import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import MediaCard from '@/components/common/MediaCard'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import type { StoredSeries } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'

type Props = {
  series: StoredSeries
  watchedEpisodes: number
  rating: Rating | null
  onRate: (rating: Rating) => void
  onClick: () => void
  eager?: boolean
  onShowRecommendations?: () => void
  isRecommendationSource?: boolean
}

export default function SeriesCard({ series, watchedEpisodes, rating, onRate, onClick, eager = false, onShowRecommendations, isRecommendationSource = false }: Props) {
  const { t } = useTranslation()
  const total = series.number_of_episodes
  const completed = total > 0 && watchedEpisodes >= total

  return (
    <MediaCard posterPath={series.poster_path} title={series.name} onClick={onClick} eager={eager} isSelected={isRecommendationSource} variant="md">
      {total > 0 && (
        <span
          role="img"
          aria-label={t('myList.episodesProgress', { watched: watchedEpisodes, total })}
          className={clsx(
            'text-[10px] px-1.5 py-0 rounded border whitespace-nowrap',
            completed
              ? 'bg-primary/10 border-primary/30 text-primary hc:bg-primary hc:border-primary hc:text-primary-foreground'
              : 'bg-muted border-border/50 hc:border-border text-muted-foreground'
          )}
        >
          <span aria-hidden="true">{watchedEpisodes}/{total} ep.</span>
        </span>
      )}

      <StarRating value={rating} onChange={completed ? onRate : undefined} readonly={!completed} size={14} ariaLabel={t('myList.rating')} />

      <Tooltip
        content={completed ? t('myList.recommendations.rateFirst') : t('myList.finishToRate')}
        disabled={!!onShowRecommendations}
        placement="top"
      >
        <button
          aria-label={`${t('myList.recommendations.similar')}: ${series.name}`}
          onClick={onShowRecommendations ? (e) => { e.stopPropagation(); onShowRecommendations() } : undefined}
          disabled={!onShowRecommendations}
          className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed ${
            isRecommendationSource
              ? 'border-primary/50 text-primary bg-primary/5 hc:border-primary hc:bg-primary hc:text-primary-foreground'
              : onShowRecommendations
                ? 'border-primary/40 text-primary/80 hover:border-primary hover:text-primary hc:border-primary hc:text-primary hc:hover:bg-muted'
                : 'border-border/40 text-muted-foreground/30 hc:border-border hc:text-muted-foreground'
          }`}
        >
          {t('myList.recommendations.similar')}
        </button>
      </Tooltip>
    </MediaCard>
  )
}
