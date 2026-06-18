'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Tooltip from '@/components/ui/Tooltip'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import { useTruncated } from '@/hooks/useTruncated'
import MediaPoster from '@/components/common/MediaPoster'
import Ribbon from '@/components/ui/Ribbon'

export function TitleCell({ title }: { title: string }) {
  const { ref, isTruncated } = useTruncated<HTMLSpanElement>(title)
  return (
    <Tooltip content={title} disabled={!isTruncated} placement="top">
      <span ref={ref} className="block truncate font-medium text-foreground">{title}</span>
    </Tooltip>
  )
}

export function PosterCell({ posterPath, title, isWatched }: { posterPath: string | null; title: string; isWatched: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="relative w-9 h-14 overflow-hidden rounded">
      <MediaPoster posterPath={posterPath} title={title} />
      {isWatched && (
        <Ribbon label={t('common.watched')} colorClass="bg-primary text-primary-foreground" size="sm" data-cy="watched-ribbon" />
      )}
    </div>
  )
}

export function GenresCell({ genreIds, language }: { genreIds?: number[]; language: string }) {
  const genres = useMemo(() =>
    Array.from(
      new Map(
        (genreIds ?? [])
          .map((gid) => [getGenreIcon(gid), gid] as const)
          .filter((entry): entry is [Exclude<ReturnType<typeof getGenreIcon>, null>, number] => entry[0] !== null)
      ).entries()
    ), [genreIds])

  if (genres.length === 0) return null
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {genres.map(([Icon, gid]) => (
        <Tooltip key={gid} content={resolveGenreName(gid, language)} placement="top">
          <Icon size={13} className="text-muted-foreground shrink-0" />
        </Tooltip>
      ))}
    </span>
  )
}
