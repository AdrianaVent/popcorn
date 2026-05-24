'use client'

import Tooltip from '@/components/ui/Tooltip'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import { useTruncated } from '@/hooks/useTruncated'

export function TitleCell({ title }: { title: string }) {
  const { ref, isTruncated } = useTruncated<HTMLSpanElement>(title)
  return (
    <Tooltip content={title} disabled={!isTruncated} placement="top">
      <span ref={ref} className="block truncate font-medium text-foreground">{title}</span>
    </Tooltip>
  )
}

export function GenresCell({ genreIds, language }: { genreIds?: number[]; language: string }) {
  const genres = Array.from(
    new Map(
      (genreIds ?? []).map((gid) => [getGenreIcon(gid), gid] as const).filter(([Icon]) => Icon !== null)
    ).entries()
  )
  if (genres.length === 0) return null
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {genres.map(([Icon, gid]) => (
        <Tooltip key={gid} content={resolveGenreName(gid, language)} placement="top">
          {Icon && <Icon size={13} className="text-muted-foreground shrink-0" />}
        </Tooltip>
      ))}
    </span>
  )
}
