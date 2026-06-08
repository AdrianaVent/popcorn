'use client'

import { useTranslation } from 'react-i18next'
import MediaCard from '@/components/common/MediaCard'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import type { StoredMovie } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'

type Props = {
  movie: StoredMovie
  rating: Rating | null
  onRate: (rating: Rating) => void
  onClick: () => void
  eager?: boolean
  onShowRecommendations?: () => void
  isRecommendationSource?: boolean
  showRecommendations?: boolean
}

export default function MovieCard({ movie, rating, onRate, onClick, eager = false, onShowRecommendations, isRecommendationSource = false, showRecommendations = true }: Props) {
  const { t } = useTranslation()
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <MediaCard posterPath={movie.poster_path} title={movie.title} onClick={onClick} eager={eager} isSelected={isRecommendationSource} variant="md">
      {year && <p className="text-[11px] text-muted-foreground">{year}</p>}
      <StarRating value={rating} onChange={onRate} size={14} ariaLabel={t('myList.rating')} />
      {showRecommendations && <Tooltip content={t('myList.recommendations.rateFirst')} disabled={!!onShowRecommendations} placement="top">
        <button
          aria-label={`${t('myList.recommendations.similar')}: ${movie.title}`}
          onClick={onShowRecommendations ? (e) => { e.stopPropagation(); onShowRecommendations() } : undefined}
          disabled={!onShowRecommendations}
          className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed ${
            isRecommendationSource
              ? 'border-primary text-primary bg-primary/10 hc:bg-primary hc:text-primary-foreground'
              : onShowRecommendations
                ? 'border-primary/40 text-primary/80 hover:border-primary hover:bg-primary/5 hc:border-primary hc:text-primary hc:hover:bg-muted'
                : 'border-border/40 text-muted-foreground/30 hc:border-border hc:text-muted-foreground'
          }`}
        >
          {t('myList.recommendations.similar')}
        </button>
      </Tooltip>}
    </MediaCard>
  )
}
