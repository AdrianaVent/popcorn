'use client'

import { useLanguageStore } from '@/store/languageStore'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'

type Genre = { id: number; name: string }

type Props = {
  genres: Genre[]
  label: string
}

export default function GenreGrid({ genres, label }: Props) {
  const { language } = useLanguageStore()
  if (genres.length === 0) return null

  return (
    <div className="col-span-2 flex items-start gap-3 mt-1">
      <span className="text-muted-foreground shrink-0 w-24 text-small">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
        {(() => {
          const seenNames = new Set<string>()
          const seenIcons = new Set<unknown>()
          return genres.flatMap((g) => {
            const name = resolveGenreName(g.id, language, g.name)
            if (seenNames.has(name)) return []
            seenNames.add(name)
            const Icon = getGenreIcon(g.id)
            const showIcon = Icon !== null && !seenIcons.has(Icon)
            if (Icon) seenIcons.add(Icon)
            return (
              <span
                key={g.id}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50 whitespace-nowrap flex items-center gap-1"
              >
                {showIcon && <Icon size={11} strokeWidth={1.5} />}
                {name}
              </span>
            )
          })
        })()}
      </div>
    </div>
  )
}
