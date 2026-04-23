'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Modal from '@/components/ui/Modal'
import MoviePoster from '@/components/common/MoviePoster'
import Text from '@/components/ui/Text'

import { useMovieDetail } from './useMovieDetail'
import CollectionAccordion from './CollectionAccordion'
import MovieMetaGrid from './MovieMetaGrid'
import MovieDetailSkeleton from './MovieDetailSkeleton'
import { getMovieUI } from '@/utils/getMovieUI'
import { useLanguageStore } from '@/store/languageStore'

type Props = {
  movieId: number
  onClose: () => void
}

export default function MovieDetailModal({ movieId, onClose }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const [currentId, setCurrentId] = useState(movieId)
  const { detail, loading, error } = useMovieDetail(currentId)

  const ui = getMovieUI(detail)

  return (
    <Modal title={detail?.title ?? '...'} onClose={onClose} maxWidth="44rem">

      {loading && <MovieDetailSkeleton />}

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

            <MoviePoster
              posterPath={detail.poster_path}
              title={detail.title}
              variant="md"
              className="shadow-md"
            />

            <div className="flex flex-col gap-3 min-w-0 flex-1">

              <Text
                variant="subtitle"
                as="h2"
                className="text-foreground leading-tight text-[1.4rem]"
              >
                {detail.title}
              </Text>

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
                      {detail.release_date
                        ? (() => {
                            const s = new Date(detail.release_date).toLocaleDateString(language, {
                              month: 'long',
                              year: 'numeric',
                            })
                            return s.charAt(0).toUpperCase() + s.slice(1)
                          })()
                        : '—'}
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

          {/* OVERVIEW */}
          {detail.overview && (
            <div className="flex flex-col gap-2 pt-5">
              <Text className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t('movies.detail.overview')}
              </Text>

              <Text variant="body" className="text-foreground leading-relaxed">
                {detail.overview}
              </Text>
            </div>
          )}

        </div>
      )}
    </Modal>
  )
}