'use client'

import { useTranslation } from 'react-i18next'
import Header from '@/components/ui/Header'

const CARD_COUNT = 14

export default function Loading() {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Header title={t('myList.title')} />

      {/* Tab skeleton */}
      <div className="relative flex w-full items-end">
        <div className="absolute inset-x-0 bottom-0 border-b border-border" />
        <div className="flex-1 pb-1.5" />
        {[t('nav.movies'), t('nav.series')].map((label, i) => (
          <button
            key={label}
            disabled
            className={[
              'px-5 py-2 text-sm font-medium border -mb-px relative z-10 rounded-t-lg',
              i === 0 ? 'bg-card border-border text-foreground' : 'bg-transparent border-transparent text-muted-foreground',
            ].join(' ')}
            style={i === 0 ? { borderBottomColor: 'var(--color-card)' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="w-full aspect-2/3 rounded-lg bg-border animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-border animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-border animate-pulse" />
            <div className="h-3 w-20 rounded bg-border animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
