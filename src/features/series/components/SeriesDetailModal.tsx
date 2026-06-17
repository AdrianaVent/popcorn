'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import IconToggleButton from '@/components/ui/IconToggleButton'
import MediaPoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import { useSeriesDetail } from '@/features/series/hooks/useSeriesDetail'
import { useSeriesCredits } from '@/features/series/hooks/useSeriesCredits'
import { useWatchProviders } from '@/hooks/useWatchProviders'
import { fetchSeriesWatchProviders, fetchSeriesVideos } from '@/features/series/series.service'
import { useSeriesMarkAll } from '@/features/series/hooks/useSeriesMarkAll'
import { getSeriesUI } from '@/features/series/getSeriesUI'
import WatchProviders from '@/components/common/WatchProviders'
import { useWatchedStore } from '@/store/watchedStore'
import { useWatchlistStore } from '@/store/watchlistStore'
import { useUserStore } from '@/store/userStore'
import type { StoredSeries } from '@/store/watchedStore'
import WatchedToggleButton from '@/components/ui/WatchedToggleButton'
import { HeartIcon } from '@/components/icons'
import TrailerPlayer from '@/components/ui/TrailerPlayer'
import Tooltip from '@/components/ui/Tooltip'
import { useTrailer, useEnrichedTrailers, resolveHeaderTrailer } from '@/hooks/useTrailer'
import { useLanguageStore } from '@/store/languageStore'

import SeriesMetaGrid from './SeriesMetaGrid'
import MediaDetailSkeleton from '@/components/common/MediaDetailSkeleton'
import SeasonsAccordion from './SeasonsAccordion'
import CastSection from '@/components/common/CastSection'
import PersonModal from '@/features/person/PersonModal'
import dynamic from 'next/dynamic'

const MovieDetailModal = dynamic(() => import('@/features/movies/components/MovieDetailModal'), { ssr: false })

type Props = {
  seriesId: number
  onClose: () => void
  totalRuntime?: number | null
}

export default function SeriesDetailModal({ seriesId, onClose, totalRuntime: totalRuntimeProp }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const [currentId, setCurrentId] = useState(seriesId)
  const { detail, loading, error, totalRuntime: totalRuntimeHook } = useSeriesDetail(currentId)
  const totalRuntime = totalRuntimeProp ?? totalRuntimeHook
  const { cast, crew } = useSeriesCredits(currentId)
  const { flatrate, rent, loading: providersLoading } = useWatchProviders(currentId, fetchSeriesWatchProviders, 'series')

  const userId = useUserStore((s) => s.userId)
  const role   = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const watchedCount = useWatchedStore((s) => Object.keys(s.episodes[userKey]?.[currentId] ?? {}).length)

  const watchlistSeries = useWatchlistStore((s) => s.series[userKey])
  const toggleWatchlist = useWatchlistStore((s) => s.toggleSeries)
  const isInWatchlist   = !!watchlistSeries?.[currentId]

  const [showTrailer, setShowTrailer] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
  const { allTrailers: rawSeriesTrailers } = useTrailer(
    ['series-trailer', currentId],
    () => fetchSeriesVideos(currentId),
    true,
    language,
  )
  const seriesAllTrailers = useEnrichedTrailers(rawSeriesTrailers)
  const trailer = resolveHeaderTrailer(seriesAllTrailers, language)

  const ui = getSeriesUI(detail)
  const validSeasons = useMemo(
    () => (detail?.seasons ?? []).filter((s) => s.air_date && s.season_number > 0),
    [detail],
  )
  const totalEpisodes = validSeasons.reduce((sum, s) => sum + s.episode_count, 0)
  const allWatched = totalEpisodes > 0 && watchedCount >= totalEpisodes

  const seriesSnapshot: StoredSeries | undefined = useMemo(() => detail ? {
    id: detail.id,
    name: detail.name,
    first_air_date: detail.first_air_date,
    vote_average: detail.vote_average,
    vote_count: detail.vote_count,
    poster_path: detail.poster_path,
    original_language: detail.original_language,
    number_of_episodes: detail.number_of_episodes,
    genre_ids: detail.genres?.map((g) => g.id) ?? [],
  } : undefined, [detail])

  const { markLoading, handleMarkAll } = useSeriesMarkAll(currentId, validSeasons, userKey, seriesSnapshot, language)

  return (
    <>
    <Modal title={detail?.name ?? '...'} onClose={onClose} maxWidth="44rem">

      {loading && <MediaDetailSkeleton />}

      {!loading && error && (
        <Text variant="body" className="text-muted-foreground text-center py-8">
          {t(`tmdb.errors.${error}`, { defaultValue: t('series.error') })}
        </Text>
      )}

      {!loading && !error && detail && (
        <div className="space-y-6">

          {/* HEADER */}
          <div className="flex gap-6 items-start">

            <div className="relative overflow-hidden rounded-lg shrink-0">
              <MediaPoster
                posterPath={detail.poster_path}
                title={detail.name}
                variant="md"
                className="shadow-md"
              />
              {ui.statusConfig && (
                <div className={`absolute top-3 -left-6 w-24 py-0.5 rotate-[-35deg] text-[7px] font-semibold uppercase tracking-wide text-center shadow-sm ${ui.statusConfig.ribbon}`}>
                  {t(ui.statusConfig.labelKey)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-0 flex-1">

              <div className="flex items-start justify-between gap-3">
                <Text
                  variant="subtitle"
                  as="h2"
                  className="text-foreground leading-tight text-[1.4rem]"
                >
                  {detail.name}
                </Text>

                <div className="flex items-center gap-2 shrink-0">
                  {trailer && (
                    <Tooltip content={t('common.trailer')} placement="top">
                      <IconToggleButton
                        data-cy="trailer-button"
                        aria-label={t('common.trailer')}
                        active={showTrailer}
                        onClick={() => setShowTrailer((v) => !v)}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M3 2l7 4-7 4V2z" />
                        </svg>
                      </IconToggleButton>
                    </Tooltip>
                  )}
                  {role !== 'admin' && !allWatched && (
                    <Tooltip content={isInWatchlist ? t('myList.watchlist.remove') : t('myList.watchlist.add')} placement="top">
                      <IconToggleButton
                        data-cy="watchlist-toggle"
                        aria-label={isInWatchlist ? t('myList.watchlist.remove') : t('myList.watchlist.add')}
                        active={isInWatchlist}
                        onClick={() => detail && toggleWatchlist(userKey, {
                          id: detail.id,
                          name: detail.name,
                          first_air_date: detail.first_air_date,
                          poster_path: detail.poster_path,
                          vote_average: detail.vote_average,
                          vote_count: detail.vote_count,
                          original_language: detail.original_language,
                          addedAt: Date.now(),
                        })}
                      >
                        <HeartIcon size={13} filled={isInWatchlist} />
                      </IconToggleButton>
                    </Tooltip>
                  )}
                  {role !== 'admin' && (
                    <WatchedToggleButton
                      isWatched={allWatched}
                      label={allWatched ? t('series.detail.watched') : t('series.detail.markSeriesWatched')}
                      onClick={handleMarkAll}
                      loading={markLoading}
                    />
                  )}
                </div>
              </div>

              {detail.tagline && (
                <Text variant="small" className="text-muted-foreground italic">
                  {detail.tagline}
                </Text>
              )}

              {/* META GRID */}
              <SeriesMetaGrid
                detail={detail}
                firstAirYear={ui.firstAirYear}
                totalRuntime={totalRuntime}
              />

            </div>
          </div>

          {showTrailer && trailer && <TrailerPlayer trailerKey={trailer.key} onClose={() => setShowTrailer(false)} />}

          {/* SEASONS */}
          {detail.seasons.length > 0 && (
            <SeasonsAccordion
              seasons={detail.seasons}
              seriesName={detail.name}
              seriesId={currentId}
              seriesSnapshot={seriesSnapshot}
              seriesAllTrailers={seriesAllTrailers}
            />
          )}

          {/* WATCH PROVIDERS */}
          <WatchProviders flatrate={flatrate} rent={rent} loading={providersLoading} />

          {/* OVERVIEW */}
          <div className="flex flex-col gap-2 pt-5">
            <Text className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t('series.detail.overview')}
            </Text>
            {detail.overview ? (
              <Text variant="small" className="text-foreground leading-relaxed">
                {detail.overview}
              </Text>
            ) : (
              <Text variant="small" className="text-muted-foreground italic">
                {t('common.noOverview')}
              </Text>
            )}
          </div>

          {/* CAST */}
          <CastSection cast={cast} crew={crew} creators={detail.created_by} mediaType="series" onPersonClick={setSelectedPersonId} />

        </div>
      )}

    </Modal>

    {selectedPersonId !== null && (
      <PersonModal
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
        onCreditClick={(type, id) => {
          setSelectedPersonId(null)
          if (type === 'tv') setCurrentId(id)
          else setSelectedMovieId(id)
        }}
      />
    )}

    {selectedMovieId !== null && (
      <MovieDetailModal
        movieId={selectedMovieId}
        onClose={() => setSelectedMovieId(null)}
      />
    )}
    </>
  )
}
