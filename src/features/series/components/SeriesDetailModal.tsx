'use client'

import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import MediaPoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import { useSeriesDetail } from '@/features/series/hooks/useSeriesDetail'
import { getSeriesUI } from '@/features/series/getSeriesUI'
import type { StoredSeries } from '@/store/watchedStore'

import SeriesMetaGrid from './SeriesMetaGrid'
import SeriesDetailSkeleton from './SeriesDetailSkeleton'
import SeasonsAccordion from './SeasonsAccordion'

type Props = {
  seriesId: number
  onClose: () => void
}

export default function SeriesDetailModal({ seriesId, onClose }: Props) {
  const { t } = useTranslation()
  const { detail, loading, error } = useSeriesDetail(seriesId)

  const ui = getSeriesUI(detail)

  const seriesSnapshot: StoredSeries | undefined = detail ? {
    id: detail.id,
    name: detail.name,
    first_air_date: detail.first_air_date,
    vote_average: detail.vote_average,
    vote_count: detail.vote_count,
    poster_path: detail.poster_path,
    original_language: detail.original_language,
    number_of_episodes: detail.number_of_episodes,
  } : undefined

  return (
    <Modal title={detail?.name ?? '...'} onClose={onClose} maxWidth="44rem">

      {loading && <SeriesDetailSkeleton />}

      {!loading && error && (
        <Text variant="body" className="text-muted-foreground text-center py-8">
          {t(`tmdb.errors.${error}`, { defaultValue: t('series.error') })}
        </Text>
      )}

      {!loading && !error && detail && (
        <div className="space-y-6">

          {/* HEADER */}
          <div className="flex gap-6 items-start">

            <MediaPoster
              posterPath={detail.poster_path}
              title={detail.name}
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
                  {detail.name}
                </Text>

                {ui.statusConfig && (
                  <span className={`shrink-0 mt-1 text-[11px] px-2 py-0.5 rounded-md border font-medium whitespace-nowrap ${ui.statusConfig.border} ${ui.statusConfig.bg} ${ui.statusConfig.text}`}>
                    {t(ui.statusConfig.labelKey)}
                  </span>
                )}
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
                avgRuntime={ui.avgRuntime}
              />

            </div>
          </div>

          {/* SEASONS */}
          {detail.seasons.length > 0 && (
            <SeasonsAccordion
              seasons={detail.seasons}
              seriesName={detail.name}
              seriesId={seriesId}
              seriesSnapshot={seriesSnapshot}
            />
          )}

          {/* OVERVIEW */}
          {detail.overview && (
            <div className="flex flex-col gap-2 pt-5">
              <Text className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t('series.detail.overview')}
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
