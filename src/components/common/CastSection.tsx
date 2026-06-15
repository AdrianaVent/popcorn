'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import CastCard from '@/components/common/CastCard'
import type { TMDBCastMember, TMDBCrewMember } from '@/types/tmdb'

const MAX_CAST = 8

type Props = {
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
  // For movies: show Director; for series: pass creators directly
  creators?: { id: number; name: string; profile_path: string | null }[]
  mediaType: 'movie' | 'series'
}

function findDirector(crew: TMDBCrewMember[]): TMDBCrewMember | undefined {
  return crew.find((m) => m.job === 'Director')
}

export default function CastSection({ cast, crew, creators, mediaType }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const director = mediaType === 'movie' ? findDirector(crew) : undefined
  const hasMore = cast.length > MAX_CAST
  const visibleCast = expanded ? cast : cast.slice(0, MAX_CAST)

  if (!director && (!creators || creators.length === 0) && cast.length === 0) return null

  return (
    <div className="flex flex-col gap-3 pt-5" aria-label={t('cast.title')}>
      <div className="flex items-center justify-between">
        <Text className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('cast.title')}
        </Text>
        {hasMore && (
          <Tooltip
            content={expanded ? t('cast.showLess') : t('cast.showMore', { count: cast.length - MAX_CAST })}
            placement="top"
          >
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t('cast.showLess') : t('cast.showMore', { count: cast.length - MAX_CAST })}
              className="w-5 h-5 flex items-center justify-center rounded border border-border bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground text-xs font-semibold leading-none"
            >
              {expanded ? '−' : '+'}
            </button>
          </Tooltip>
        )}
      </div>

      {/* Director or Creator row */}
      {mediaType === 'movie' && director && (
        <div className="flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground shrink-0">{t('cast.director')}:</Text>
          <Text variant="small" className="text-foreground">{director.name}</Text>
        </div>
      )}
      {mediaType === 'series' && creators && creators.length > 0 && (
        <div className="flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground shrink-0">{t('cast.creator')}:</Text>
          <Text variant="small" className="text-foreground">
            {creators.map((c) => c.name).join(', ')}
          </Text>
        </div>
      )}

      {/* Cast carousel / grid */}
      {visibleCast.length > 0 && (
        <div
          className={expanded ? 'flex flex-wrap gap-5' : 'flex gap-5 overflow-x-auto pb-1 scrollbar-hide'}
          role="list"
          aria-label={t('cast.title')}
        >
          {visibleCast.map((member) => (
            <div key={`${member.id}-${member.order}`} role="listitem">
              <CastCard
                name={member.name}
                sub={member.character}
                profilePath={member.profile_path}
              />
            </div>
          ))}


        </div>
      )}
    </div>
  )
}
