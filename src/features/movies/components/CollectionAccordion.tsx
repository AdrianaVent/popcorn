'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import AccordionList from '@/components/ui/AccordionList'
import MediaPoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import TrailerPlayer from '@/components/ui/TrailerPlayer'
import { useCollectionDetail } from '@/features/movies/hooks/useCollectionDetail'
import { fetchMovieVideos } from '@/features/movies/movies.service'
import { useTrailer } from '@/hooks/useTrailer'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { EyeIcon } from '@/components/icons'
import WatchedToggleButton from '@/components/ui/WatchedToggleButton'
import type { TMDBCollection, TMDBCollectionPart } from '@/types/tmdb'

type ItemProps = {
  part: TMDBCollectionPart
  index: number
  isCurrent: boolean
  isWatched: boolean
  onSelect?: (id: number) => void
  language: string
}

function SagaMovieItem({ part, index, isCurrent, isWatched, onSelect, language }: ItemProps) {
  const { t } = useTranslation()
  const [showTrailer, setShowTrailer] = useState(false)
  const trailerRef = useRef<HTMLDivElement>(null)

  const { trailer } = useTrailer(
    ['movie-trailer', part.id],
    () => fetchMovieVideos(part.id),
    true,
    language,
  )

  useEffect(() => {
    if (showTrailer && trailerRef.current) {
      trailerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showTrailer])

  return (
    <div className={clsx(
      'transition-colors',
      (isCurrent || showTrailer) && 'bg-cream-300 dark:bg-gray-700',
      isCurrent && 'border-l-2 border-primary',
      showTrailer && !isCurrent && 'border-l-2 border-primary/40',
    )}>
      <div
        onClick={() => !isCurrent && onSelect?.(part.id)}
        className={clsx(
          'flex items-center gap-3 px-3 py-2 transition-colors',
          isCurrent && 'shadow-[inset_2px_0_0_var(--color-primary)]',
          !isCurrent && !showTrailer && 'bg-card hover:bg-cream-400 dark:hover:bg-gray-700',
          !isCurrent && onSelect && 'cursor-pointer',
          isWatched && !isCurrent && 'opacity-60'
        )}
      >
        <span className="text-xs font-mono w-4 text-center text-muted-foreground shrink-0">
          {index + 1}
        </span>

        <div className="relative shrink-0">
          <MediaPoster posterPath={part.poster_path} title={part.title} variant="sm" />
          {isWatched && (
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary border-2 border-card flex items-center justify-center text-primary-foreground">
              <EyeIcon size={8} strokeWidth={2.5} />
            </span>
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <Text variant="small" className="truncate text-foreground">
            {part.title}
          </Text>
          {part.release_date && (
            <Text variant="caption" className="text-muted-foreground">
              {new Date(part.release_date).getFullYear()}
            </Text>
          )}
        </div>

        {isCurrent && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-muted px-1.5 py-0.5 rounded">
            {t('movies.detail.current')}
          </span>
        )}

        {trailer && (
          <Tooltip content={t('common.trailer')} placement="top">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTrailer((v) => !v) }}
              className={clsx(
                'shrink-0 w-7 h-7 flex items-center justify-center rounded border transition-colors cursor-pointer',
                showTrailer
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground/40 hover:border-primary/40 hover:text-primary',
              )}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 2l7 4-7 4V2z" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>

      {showTrailer && trailer && (
        <div ref={trailerRef} className="px-4 py-3 border-t border-border/30 flex justify-center">
          <TrailerPlayer trailerKey={trailer.key} className="w-full max-w-xs aspect-video border border-border rounded-lg overflow-hidden" onClose={() => setShowTrailer(false)} />
        </div>
      )}
    </div>
  )
}

type Props = {
  collection: TMDBCollection
  movieId: number
  onMovieSelect?: (id: number) => void
}

export default function CollectionAccordion({ collection, movieId, onMovieSelect }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const { detail, loading } = useCollectionDetail(collection.id, true)
  const userId = useUserStore((s) => s.userId)
  const role   = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])
  const toggleMovie   = useWatchedStore((s) => s.toggleMovie)

  const today = new Date().toISOString().slice(0, 10)
  // All parts with a known date — shown in the list (includes future releases)
  const partsWithDate = (detail?.parts ?? [])
    .filter((p) => !!p.release_date)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
  // Only already-released parts — eligible for the "mark saga watched" toggle
  const eligibleParts = partsWithDate.filter((p) => p.release_date <= today)
  const allEligibleWatched = eligibleParts.length > 0 && eligibleParts.every((p) => !!watchedMovies?.[p.id])

  if (!loading && partsWithDate.length <= 1) return null

  const handleMarkSaga = () => {
    const toToggle = allEligibleWatched
      ? eligibleParts
      : eligibleParts.filter((p) => !watchedMovies?.[p.id])
    toToggle.forEach((p) => toggleMovie(userKey, {
      id: p.id,
      title: p.title,
      release_date: p.release_date,
      vote_average: p.vote_average,
      vote_count: 0,
      poster_path: p.poster_path,
      original_language: '',
      collection_id: collection.id,
      collection_name: collection.name,
      genre_ids: p.genre_ids ?? [],
    }))
  }

  return (
    <AccordionList
      title={
        <div className="flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground">
            {t('movies.detail.collection')}
          </Text>
          <Text variant="small" className="text-foreground font-medium truncate">
            {collection.name}
          </Text>
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
