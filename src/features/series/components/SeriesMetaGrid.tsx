'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MetaRow from '@/components/common/MetaRow'
import StarRating from '@/components/ui/StarRating'
import GenreGrid from '@/components/ui/GenreGrid'
import { useLanguageStore } from '@/store/languageStore'
import { formatVoteCount, tmdbToStarRating, formatRuntime } from '@/utils/formatNumber'
import type { TMDBSeriesDetail } from '@/types/tmdb'

type Props = {
  detail: TMDBSeriesDetail
  firstAirYear: number | null
  totalRuntime: number | null
}

export default function SeriesMetaGrid({ detail, firstAirYear, totalRuntime }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()

  const rows = useMemo(() => [
    totalRuntime && { label: t('series.detail.runtime'), value: formatRuntime(totalRuntime, language) },
    firstAirYear && { label: t('series.detail.year'), value: firstAirYear.toString() },
    { label: t('series.detail.seasons'),  value: detail.number_of_seasons.toString() },
    { label: t('series.detail.episodes'), value: detail.number_of_episodes.toString() },
    {
      label: t('series.detail.rating'),
      value: (
        <div className="flex items-center gap-2">
          <StarRating value={tmdbToStarRating(detail.vote_average)} readonly size={16} />
          <span className="text-sm text-foreground">{detail.vote_average.toFixed(1)}</span>
        </div>
      ),
    },
    { label: t('series.detail.votes'), value: formatVoteCount(detail.vote_count, language) },
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>, [detail, firstAirYear, totalRuntime, language, t])

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
      {rows.map((row) => (
        <MetaRow key={row.label} label={row.label} value={row.value} />
      ))}

      <GenreGrid genres={detail.genres} label={t('series.detail.genres')} />
    </div>
  )
}
