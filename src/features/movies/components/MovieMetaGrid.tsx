'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MetaRow from '@/components/common/MetaRow'
import StarRating from '@/components/ui/StarRating'
import GenreGrid from '@/components/ui/GenreGrid'
import { useLanguageStore } from '@/store/languageStore'
import { formatVoteCount, tmdbToStarRating, formatRuntime } from '@/utils/formatNumber'
import type { TMDBMovieDetail } from '@/types/tmdb'

type Props = {
  detail: TMDBMovieDetail
  isUpcoming: boolean
  releaseYear: number | null
}

export default function MovieMetaGrid({ detail, isUpcoming, releaseYear }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const rows = useMemo(() => {
    if (isUpcoming) return []

    return [
      detail.runtime && { label: t('movies.detail.runtime'), value: formatRuntime(detail.runtime, language) },
      { label: t('movies.detail.year'), value: releaseYear?.toString() ?? '—' },
      {
        label: t('movies.detail.rating'),
        value: (
          <div className="flex items-center gap-2">
            <StarRating value={tmdbToStarRating(detail.vote_average)} readonly size={16} />
            <span className="text-sm text-foreground">{detail.vote_average.toFixed(1)}</span>
          </div>
        ),
      },
      { label: t('movies.detail.votes'), value: formatVoteCount(detail.vote_count, language) },
    ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>
  }, [detail, isUpcoming, releaseYear, language, t])

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
      {rows.map((row) => (
        <MetaRow key={row.label} label={row.label} value={row.value} />
      ))}

      <GenreGrid genres={detail.genres} label={t('movies.detail.genres')} />
    </div>
  )
}
