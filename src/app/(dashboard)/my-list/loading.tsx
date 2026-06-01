'use client'

import { useTranslation } from 'react-i18next'
import Header from '@/components/ui/Header'
import { BookmarkIcon, FilmIcon, TvIcon } from '@/components/icons'

const CARD_COUNT = 10

export default function Loading() {
  const { t } = useTranslation()

  const tabSwitcher = (
    <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      {([
        { icon: <FilmIcon size={13} />, label: t('nav.movies'), active: true },
        { icon: <TvIcon size={13} />,  label: t('nav.series'), active: false },
      ]).map(({ icon, label, active }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded ${
            active ? 'bg-primary/20 text-primary font-medium' : 'text-muted-foreground'
          }`}
        >
          {icon}
          {label}
        </div>
      ))}
    </div>
  )

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-6">
      <Header title={t('myList.title')} start={<BookmarkIcon size={32} strokeWidth={1.5} />} end={tabSwitcher} />

      <div className="mt-3 flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 pt-0.5 px-0.5">
          {Array.from({ length: CARD_COUNT }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 w-24 items-center">
              {/* Poster */}
              <div className="w-24 aspect-2/3 rounded-lg bg-border animate-pulse" />
              {/* Year */}
              <div className="h-2.5 w-10 rounded bg-border animate-pulse" />
              {/* Star rating */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-3.5 h-3.5 rounded-full bg-border animate-pulse" />
                ))}
              </div>
              {/* Recommendations button */}
              <div className="h-5 w-full rounded-md bg-border animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
