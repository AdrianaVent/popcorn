'use client'

import { useTranslation } from 'react-i18next'
import MediaPoster from '@/components/common/MediaPoster'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import { useTruncated } from '@/hooks/useTruncated'
import type { StoredMovie } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'

type Props = {
  movie: StoredMovie
  rating: Rating | null
  onRate: (rating: Rating) => void
  onClick: () => void
  eager?: boolean
}

export default function MovieCard({ movie, rating, onRate, onClick, eager = false }: Props) {
  const { t } = useTranslation()
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const { ref: titleRef, isTruncated } = useTruncated(movie.title)

  return (
    <div className="flex flex-col gap-2 group">
      <button
        onClick={onClick}
        className="relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MediaPoster
          posterPath={movie.poster_path}
          title={movie.title}
          variant="fluid"
          loading={eager ? 'eager' : 'lazy'}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
      </button>

      <div className="flex flex-col gap-1 px-0.5 items-center w-full">
        <Tooltip content={movie.title} disabled={!isTruncated} placement="bottom" className="w-full">
          <p ref={titleRef} className="text-[13px] font-medium text-foreground leading-tight truncate w-full text-center">
            {movie.title}
          </p>
        </Tooltip>
        {year && (
          <p className="text-[11px] text-muted-foreground">{year}</p>
        )}
        <StarRating value={rating} onChange={onRate} size={15} />
        {!rating && (
          <p className="text-[10px] text-muted-foreground/60 italic">
            {t('myList.rate')}
          </p>
        )}
      </div>
    </div>
  )
}
