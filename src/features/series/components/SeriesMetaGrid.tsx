'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MetaRow from '@/components/common/MetaRow'
import { useLanguageStore } from '@/store/languageStore'
import { resolveSeriesGenreName } from '@/features/series/getSeriesUI'
import { formatVoteCount } from '@/utils/formatNumber'
import type { TMDBSeriesDetail } from '@/types/tmdb'

type Props = {
  detail: TMDBSeriesDetail
  firstAirYear: number | null
  avgRuntime: number | null
}

export default function SeriesMetaGrid({ detail, firstAirYear, avgRuntime }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()

  const rows = useMemo(() => [
    { label: t('series.detail.rating'),   value: `${detail.vote_average.toFixed(1)} / 10` },
    { label: t('series.detail.votes'),    value: formatVoteCount(detail.vote_count, language) },
    { label: t('series.detail.seasons'),  value: detail.number_of_seasons.toString() },
    { label: t('series.detail.episodes'), value: detail.number_of_episodes.toString() },
    avgRuntime && { label: t('series.detail.runtime'), value: `${avgRuntime} min` },
    firstAirYear && { label: t('series.detail.year'), value: firstAirYear.toString() },
  ].filter(Boolean) as Array<{ label: string; value: string }>, [detail, firstAirYear, avgRuntime, language, t])

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
      {rows.map((row) => (
        <MetaRow key={row.label} label={row.label} value={row.value} />
      ))}

      {detail.genres.length > 0 && (
        <div className="col-span-2 flex items-start gap-3 mt-1">
          <span className="text-muted-foreground shrink-0 w-24 text-small">
            {t('series.detail.genres')}
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
            {detail.genres.map((g) => (
              <span
                key={g.id}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50 whitespace-nowrap"
              >
                {resolveSeriesGenreName(g.id, g.name, language)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
