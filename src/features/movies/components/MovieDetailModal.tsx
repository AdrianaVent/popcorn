'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Modal from '@/components/ui/Modal'
import MediaPoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'

import { useMovieDetail } from '@/features/movies/hooks/useMovieDetail'
import { useWatchProviders } from '@/hooks/useWatchProviders'
import { fetchMovieWatchProviders } from '@/features/movies/movies.service'
import { useMovieInTheaters } from '@/features/movies/hooks/useMovieInTheaters'
import CollectionAccordion from './CollectionAccordion'
import MovieMetaGrid from './MovieMetaGrid'
import MediaDetailSkeleton from '@/components/common/MediaDetailSkeleton'
import WatchProviders from '@/components/common/WatchProviders'
import { getMovieUI } from '@/features/movies/getMovieUI'
import WatchedToggleButton from '@/components/ui/WatchedToggleButton'
import { useLanguageStore } from '@/store/languageStore'
import { formatMonthYear } from '@/utils/formatDate'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'

type Props = {
  movieId: number
  onClose: () => void
}

export default function MovieDetailModal({ movieId, onClose }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const [currentId, setCurrentId] = useState(movieId)
  const { detail, loading, error } = useMovieDetail(currentId)
  const { flatrate, rent, loading: providersLoading } = useWatchProviders(currentId, fetchMovieWatchProviders, 'movie')
  const { inTheaters, loading: inTheatersLoading } = useMovieInTheaters(currentId)

  const userId = useUserStore((s) => s.userId)
  const role   = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])
  const toggleMovie  = useWatchedStore((s) => s.toggleMovie)
  const enrichMovie  = useWatchedStore((s) => s.enrichMovie)
  const isWatched = !!watchedMovies?.[currentId]

  // Backfill collection info if the movie was marked watched from the table
  // (list endpoint doesn't include belongs_to_collection).
  useEffect(() => {
    if (!detail?.belongs_to_collection || !watchedMovies?.[currentId]) return
    const stored = watchedMovies[currentId]
    if (!stored.collection_id) {
      enrichMovie(userKey, currentId, {
        collection_id: detail.belongs_to_collection.id,
        collection_name: detail.belongs_to_collection.name,
      })
    }
  }, [detail, watchedMovies, currentId, userKey, enrichMovie])

  const ui = getMovieUI(detail)

  return (
    <Modal title={detail?.title ?? '...'} onClose={onClose} maxWidth="44rem">

      {loading && <MediaDetailSkeleton />}

      {!loading && error && (
        <Text variant="body" className="text-muted-foreground text-center py-8">
          {t(`tmdb.errors.${error}`, {
            defaultValue: t('movies.error'),
          })}
        </Text>
      )}

      {!loading && !error && detail && (
        <div className="space-y-6">

          {/* HEADER */}
          <div className="flex gap-6 items-start">

            <MediaPoster
              posterPath={detail.poster_path}
              title={detail.title}
              variant="md"
              className="shadow-md"
            />

            <div className="flex flex-col gap-3 min-w-0 flex-1">

              <div className="flex items-start justify-between gap-3">
                <Text
                  variant="subtitle"
                  as="h2"
                  className="text-foreground leading-tight text-[1.4rem]"
                >
                  {detail.title}
                </Text>
                {role !== 'admin' && (
                  <WatchedToggleButton
                    isWatched={isWatched}
                    label={isWatched ? t('movies.detail.watched') : t('movies.detail.markWatched')}
                    onClick={() => toggleMovie(userKey, {
                      id: detail.id,
                      title: detail.title,
                      release_date: detail.release_date,
                      vote_average: detail.vote_average,
                      vote_count: detail.vote_count,
                      poster_path: detail.poster_path,
                      original_language: detail.original_language,
                      collection_id: detail.belongs_to_collection?.id,
                      collection_name: detail.belongs_to_collection?.name,
                      genre_ids: detail.genres?.map((g) => g.id) ?? [],
                    })}
                  />
                )}
              </div>

              {detail.tagline && (
                <Text variant="small" className="text-muted-foreground italic">
                  {detail.tagline}
                </Text>
              )}

              {/* UPCOMING BADGE */}
              {ui.isUpcoming && (
                <div className="mt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-green-500/30 bg-green-100/60 dark:bg-green-900/20">

                    <span className="text-[10px] uppercase tracking-widest text-green-700 dark:text-green-300">
                      {t('movies.detail.release')}
                    </span>

                    <span className="h-3 w-px bg-green-300/60 dark:bg-green-700/50" />

                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {detail.release_date ? formatMonthYear(detail.release_date, language) : '—'}
                    </span>

                  </div>
                </div>
              )}

              {/* META GRID */}
              <MovieMetaGrid
                detail={detail}
                isUpcoming={ui.isUpcoming}
                releaseYear={ui.releaseYear}
              />

            </div>
          </div>

          {/* COLLECTION */}
          {detail.belongs_to_collection && (
            <CollectionAccordion
              collection={detail.belongs_to_collection}
              movieId={currentId}
              onMovieSelect={setCurrentId}
            />
          )}

          {/* WATCH PROVIDERS */}
          <WatchProviders flatrate={flatrate} rent={rent} inTheaters={inTheaters} loading={providersLoading || inTheatersLoading} />

          {/* OVERVIEW */}
          {detail.overview && (
            <div className="flex flex-col gap-2 pt-5">
              <Text className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t('movies.detail.overview')}
              </Text>

              <Text variant="small" className="text-foreground leading-relaxed">
                {detail.overview}
              </Text>
            </div>
          )}

        </div>
      )}
    </Modal>
  )
}