'use client'

import Image from 'next/image'
import { getTMDBImageUrl } from '@/utils/tmdb'

export default function UnwatchedMoviePlaceholder({
  part,
  onClick,
}: {
  part: { id: number; title: string; poster_path: string | null }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={part.title}
      className="flex flex-col gap-2 w-24 items-center group"
    >
      <div className="relative w-24 aspect-2/3 rounded-lg overflow-hidden bg-muted border border-dashed border-border/60 hc:border-border hover:border-border transition-colors">
        {part.poster_path && (
          <Image
            fill
            src={getTMDBImageUrl(part.poster_path, 'w185')!}
            alt=""
            className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
          />
        )}
      </div>
      <p aria-hidden="true" className="text-[11px] text-muted-foreground/50 hc:text-muted-foreground text-center truncate w-full px-0.5 leading-tight">
        {part.title}
      </p>
    </button>
  )
}
