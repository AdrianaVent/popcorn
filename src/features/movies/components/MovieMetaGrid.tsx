'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MetaRow from '@/components/common/MetaRow'
import StarRating from '@/components/ui/StarRating'
import { useLanguageStore } from '@/store/languageStore'
import { formatVoteCount, tmdbToStarRating } from '@/utils/formatNumber'
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
      detail.runtime && { label: t('movies.detail.runtime'), value: `${detail.runtime} min` },
      { label: t('movies.detail.year'), value: releaseYear?.toString() ?? '—' },
    ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>
  }, [detail, isUpcoming, releaseYear, language, t])

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
      {rows.map((row) => (
        <MetaRow key={row.label} label={row.label} value={row.value} />
      ))}

      {detail.genres.length > 0 && (
        <div className="col-span-2 flex items-start gap-3 mt-1">
          <span className="text-muted-foreground shrink-0 w-24 text-small">
            {t('movies.detail.genres')}
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
            {detail.genres.map((g) => (
              <span
                key={g.id}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50 whitespace-nowrap"
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
