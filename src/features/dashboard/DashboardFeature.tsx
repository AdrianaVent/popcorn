'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '@/components/ui/Header'
import BarChart from '@/components/ui/BarChart'
import { useUserMovieGenres, useGlobalMovieGenres } from '@/features/dashboard/hooks/useMovieGenres'
import { useUserSeriesGenres, useGlobalSeriesGenres } from '@/features/dashboard/hooks/useSeriesGenres'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'

type ContentTab = 'movies' | 'series'

const TABS: { value: ContentTab; labelKey: string }[] = [
  { value: 'movies', labelKey: 'nav.movies' },
  { value: 'series', labelKey: 'nav.series' },
]

export default function DashboardFeature() {
  const { t } = useTranslation()
  const [contentTab, setContentTab] = useState<ContentTab>('movies')

  const userId = useUserStore((s) => s.userId) ?? ''
  const watchedMovies = useWatchedStore((s) => s.movies[userId])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userId])

  const movieDefaultMode = Object.keys(watchedMovies ?? {}).length > 0 ? 'user' : 'global'
  const seriesDefaultMode = Object.keys(watchedEpisodes ?? {}).length > 0 ? 'user' : 'global'

  const userMovieGenres = useUserMovieGenres()
  const globalMovieGenres = useGlobalMovieGenres()
  const userSeriesGenres = useUserSeriesGenres()
  const globalSeriesGenres = useGlobalSeriesGenres()

  const isMovies = contentTab === 'movies'

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Header title={t('nav.home')} />

      <div className="w-full xl:w-1/2 flex flex-col">
        <div className="flex w-full items-end">
          <div className="flex-1 border-b border-border" />
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setContentTab(tab.value)}
              className={[
                'px-5 py-2 text-sm font-medium border transition-colors -mb-px relative z-10 rounded-t-lg',
                contentTab === tab.value
                  ? 'bg-card border-border text-foreground'
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
              style={contentTab === tab.value ? { borderBottomColor: 'var(--color-card)' } : {}}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <BarChart
          key={contentTab}
          title={t('dashboard.genres')}
          orientation="horizontal"
          tooltipLabel={isMovies ? t('dashboard.chart.movies') : t('dashboard.chart.series')}
          userQuery={isMovies ? userMovieGenres : userSeriesGenres}
          globalQuery={isMovies ? globalMovieGenres : globalSeriesGenres}
          defaultMode={isMovies ? movieDefaultMode : seriesDefaultMode}
          className="rounded-tr-none"
        />
      </div>
    </div>
  )
}
