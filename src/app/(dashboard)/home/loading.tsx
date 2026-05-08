'use client'

import { useTranslation } from 'react-i18next'
import Header from '@/components/ui/Header'
import { useMounted } from '@/hooks/useMounted'

const TABS = [
  { value: 'movies', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.series' },
]

const BAR_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2', 'w-3/4', 'w-2/5', 'w-1/3', 'w-1/2', 'w-3/5', 'w-1/4']

export default function Loading() {
  const { t } = useTranslation()
  const mounted = useMounted()

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {mounted ? (
        <Header title={t('nav.home')} />
      ) : (
        <div className="shrink-0 flex items-center justify-between">
          <div className="h-7 w-16 rounded-md bg-border animate-pulse" />
        </div>
      )}

      <div className="w-full xl:w-1/2 flex flex-col">
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
              {mounted
                ? t(tab.labelKey)
                : <span className="inline-block h-3.5 w-14 rounded bg-border animate-pulse" />}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-xl rounded-tr-none border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-32 rounded bg-border animate-pulse" />
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
    </div>
  )
}
