'use client'

import { useTranslation } from 'react-i18next'
import MediaCard from '@/components/common/MediaCard'
import StarRating from '@/components/ui/StarRating'
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

  return (
    <MediaCard posterPath={movie.poster_path} title={movie.title} onClick={onClick} eager={eager}>
      {year && (
        <p className="text-[11px] text-muted-foreground">{year}</p>
      )}
      <StarRating value={rating} onChange={onRate} size={15} />
      {!rating && (
        <p className="text-[10px] text-muted-foreground/60 italic">
          {t('myList.rate')}
        </p>
      )}
    </MediaCard>
  )
}
