'use client'

import { useTranslation } from 'react-i18next'
import Header from '@/components/ui/Header'
import Text from '@/components/ui/Text'

const TABS = [
  { value: 'movies', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.series' },
]

const BAR_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2', 'w-3/4', 'w-2/5', 'w-1/3', 'w-1/2', 'w-3/5', 'w-1/4']

function SkeletonTabBar({ t }: { t: (k: string) => string }) {
  return (
    <div className="flex w-full items-end">
      <div className="flex-1 border-b border-border" />
      {TABS.map((tab, i) => (
        <button
          key={tab.value}
          disabled
          className={[
            'px-5 py-2 text-sm font-medium border transition-colors -mb-px relative z-10 rounded-t-lg',
            i === 0
              ? 'bg-card border-border text-foreground'
              : 'bg-transparent border-transparent text-muted-foreground',
          ].join(' ')}
          style={i === 0 ? { borderBottomColor: 'var(--color-card)' } : {}}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}

export default function Loading() {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Header title={t('nav.home')} />

      <div className="flex flex-col xl:flex-row gap-4">
        {/* Genres skeleton */}
        <div className="w-full xl:flex-1 flex flex-col">
          <SkeletonTabBar t={t} />
          <div className="flex flex-col gap-2 rounded-xl rounded-tr-none border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <Text variant="body" className="font-semibold text-foreground">{t('dashboard.genres')}</Text>
              <div className="h-7 w-28 rounded bg-border animate-pulse" />
            </div>
            <div className="flex flex-col gap-3 mt-2">
              {BAR_WIDTHS.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-24 rounded bg-border animate-pulse shrink-0" />
                  <div className={`h-5 rounded bg-border animate-pulse ${w}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="w-full xl:flex-1 flex flex-col">
          <SkeletonTabBar t={t} />
          <div className="flex flex-col flex-1 gap-2 rounded-xl rounded-tr-none border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <Text variant="body" className="font-semibold text-foreground">{t('calendar.title')}</Text>
              <div className="h-6 w-28 rounded bg-border animate-pulse" />
            </div>
            <div className="grid grid-cols-7 gap-0.5 mt-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-border animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 flex-1" style={{ gridTemplateRows: 'repeat(5, 2.25rem)' }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="rounded-md bg-border animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
