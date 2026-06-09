'use client'

import { useTranslation } from 'react-i18next'
import AccordionList from '@/components/ui/AccordionList'
import Text from '@/components/ui/Text'
import WatchedToggleButton from '@/components/ui/WatchedToggleButton'
import SagaMovieItem from './SagaMovieItem'
import { useCollectionDetail } from '@/features/movies/hooks/useCollectionDetail'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBCollection } from '@/types/tmdb'

type Props = {
  collection: TMDBCollection
  movieId: number
  onMovieSelect?: (id: number) => void
}

export default function CollectionAccordion({ collection, movieId, onMovieSelect }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const { detail, loading } = useCollectionDetail(collection.id, true)
  const userId      = useUserStore((s) => s.userId)
  const role        = useUserStore((s) => s.role)
  const userKey     = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])
  const toggleMovie   = useWatchedStore((s) => s.toggleMovie)

  const today = new Date().toISOString().slice(0, 10)
  // All parts with a known date — shown in the list (includes future releases)
  const partsWithDate  = (detail?.parts ?? []).filter((p) => !!p.release_date).sort((a, b) => a.release_date.localeCompare(b.release_date))
  // Only already-released parts — eligible for the "mark saga watched" toggle
  const eligibleParts  = partsWithDate.filter((p) => p.release_date <= today)
  const allEligibleWatched = eligibleParts.length > 0 && eligibleParts.every((p) => !!watchedMovies?.[p.id])

  if (!loading && partsWithDate.length <= 1) return null

  const handleMarkSaga = () => {
    const toToggle = allEligibleWatched ? eligibleParts : eligibleParts.filter((p) => !watchedMovies?.[p.id])
    toToggle.forEach((p) => toggleMovie(userKey, {
      id: p.id, title: p.title, release_date: p.release_date,
      vote_average: p.vote_average, vote_count: 0, poster_path: p.poster_path,
      original_language: '', collection_id: collection.id, collection_name: collection.name,
      genre_ids: p.genre_ids ?? [],
    }))
  }

  return (
    <AccordionList
      title={
        <div className="flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground">{t('movies.detail.collection')}</Text>
          <Text variant="small" className="text-foreground font-medium truncate">{collection.name}</Text>
        </div>
      }
      actions={role !== 'admin' && eligibleParts.length > 0 ? (
        <WatchedToggleButton
          isWatched={allEligibleWatched}
          label={allEligibleWatched ? t('movies.detail.watched') : t('movies.detail.markSagaWatched')}
          onClick={handleMarkSaga}
        />
      ) : undefined}
      items={partsWithDate}
      loading={loading}
      renderItem={(part, i) => (
        <SagaMovieItem
          key={part.id}
          part={part}
          index={i}
          isCurrent={part.id === movieId}
          isWatched={!!watchedMovies?.[part.id]}
          onSelect={onMovieSelect}
          language={language}
        />
      )}
    />
  )
}
