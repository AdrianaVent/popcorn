'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import MediaPoster from '@/components/common/MediaPoster'
import type { Top10Item } from '@/features/home/hooks/useTop10'

type ContentTab = 'movies' | 'series'

type Props = {
  tab: ContentTab
  globalMovieQuery: { data?: Top10Item[]; isLoading: boolean; isError: boolean }
  globalSeriesQuery: { data?: Top10Item[]; isLoading: boolean; isError: boolean }
  userMovieItems: Top10Item[]
  userSeriesItems: Top10Item[]
  defaultMode?: 'user' | 'global'
  showUserToggle?: boolean
  onItemClick: (type: 'movie' | 'series', id: number) => void
  className?: string
}

function ItemSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="w-5 h-3 rounded animate-pulse bg-border shrink-0" />
      <div className="w-9 h-14 rounded animate-pulse bg-border shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-2.5 rounded animate-pulse bg-border w-4/5" />
        <div className="h-2 rounded animate-pulse bg-border w-2/5" />
      </div>
      <div className="w-8 h-3 rounded animate-pulse bg-border shrink-0" />
    </div>
  )
}

function ItemScore({ item, mode }: { item: Top10Item; mode: 'user' | 'global' }) {
  if (mode === 'user' && item.personalRating !== null) {
    return (
      <span className="text-[11px] font-semibold text-yellow-500 dark:text-yellow-300 shrink-0 tabular-nums">
        ★ {(item.personalRating * 2).toFixed(1)}
      </span>
    )
  }
  return (
    <span className={`text-[11px] font-semibold shrink-0 tabular-nums ${
      mode === 'user' ? 'text-muted-foreground/40' : 'text-yellow-500 dark:text-yellow-300'
    }`}>
      ★ {item.tmdbScore.toFixed(1)}
    </span>
  )
}

export default function Top10Card({
  tab,
  globalMovieQuery,
  globalSeriesQuery,
  userMovieItems,
  userSeriesItems,
  defaultMode = 'global',
  showUserToggle = true,
  onItemClick,
  className = '',
}: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'user' | 'global'>(showUserToggle ? defaultMode : 'global')

  const isMovies = tab === 'movies'
  const globalQuery = isMovies ? globalMovieQuery : globalSeriesQuery
  const userItems  = isMovies ? userMovieItems : userSeriesItems

  const items   = mode === 'user' ? userItems : (globalQuery.data ?? [])
  const loading = mode === 'global' && globalQuery.isLoading
  const error   = mode === 'global' && globalQuery.isError
  const empty   = !loading && !error && items.length === 0

  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-3 select-none${className ? ` ${className}` : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <Text variant="body" className="font-semibold text-foreground">
          {t('dashboard.top10.title')}
        </Text>
        {showUserToggle && (
          <ToggleSwitch
            options={[
              { value: 'user',   label: t('dashboard.mode.user') },
              { value: 'global', label: t('dashboard.mode.global') },
            ]}
            value={mode}
            onChange={setMode}
          />
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        {loading && (
          <div key={`${tab}-${mode}`} className="absolute inset-0 overflow-y-auto">
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => <ItemSkeleton key={i} />)}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Text variant="small" className="text-muted-foreground">{t('dashboard.chart.error')}</Text>
          </div>
        )}

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <Text variant="small" className="text-muted-foreground">
              {mode === 'user' ? t('dashboard.top10.empty') : t('dashboard.chart.error')}
            </Text>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div key={`${tab}-${mode}`} className="absolute inset-0 overflow-y-auto">
            <ol className="flex flex-col gap-0.5">
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(isMovies ? 'movie' : 'series', item.id)}
                    className="w-full flex items-center gap-2.5 py-1 rounded-lg px-1 hover:bg-muted/60 transition-colors group text-left"
                  >
                    <span className="w-5 text-center text-[11px] font-semibold text-muted-foreground shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <MediaPoster
                      posterPath={item.posterPath}
                      title={item.title}
                      variant="sm"
                      loading={i < 3 ? 'eager' : 'lazy'}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] font-medium text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                    </span>
                    <ItemScore item={item} mode={mode} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
