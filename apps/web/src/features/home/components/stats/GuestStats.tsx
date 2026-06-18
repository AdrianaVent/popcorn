'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueries } from '@tanstack/react-query'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useLanguageStore } from '@/store/languageStore'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import StatChip from './StatChip'
import ChartFooter from './ChartFooter'
import InsightsTab from './InsightsTab'
import { buildRatingHistogram, buildDecadeDistribution, getLast6MonthBuckets, getLast6Buckets } from './statsCard.utils'
import type { Period, StatTab, ChartEntry } from './statsCard.types'

type Props = { barColor: string; mutedColor: string; tab: StatTab }

export default function GuestStats({ barColor, mutedColor, tab }: Props) {
  const { t }        = useTranslation()
  const userId       = useUserStore((s) => s.userId) ?? ''
  const { language } = useLanguageStore()
  const locale       = language === 'es' ? 'es-ES' : 'en-US'
  const [period, setPeriod] = useState<Period>('weekly')

  const watchedMovies   = useWatchedStore((s) => s.movies[userId])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userId])
  const watchedSeries   = useWatchedStore((s) => s.seriesData[userId])
  const userRatings     = useRatingsStore((s) => s.ratings[userId])

  const movieList = useMemo(
    () => Object.values(watchedMovies ?? {}),
    [watchedMovies],
  )
  const seriesList = useMemo(
    () => Object.values(watchedSeries ?? {}).filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0),
    [watchedSeries, watchedEpisodes],
  )
  const episodeCount = useMemo(
    () => Object.values(watchedEpisodes ?? {}).reduce((sum, eps) => sum + Object.keys(eps).length, 0),
    [watchedEpisodes],
  )
  const allRatings = useMemo(
    () => [...Object.values(userRatings?.movies ?? {}), ...Object.values(userRatings?.series ?? {})],
    [userRatings],
  )
  const avgRating = useMemo(
    () => allRatings.length > 0 ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1) : '—',
    [allRatings],
  )

  const collectionIds = useMemo(() => {
    const seen = new Set<number>()
    for (const m of movieList) { if (m.collection_id) seen.add(m.collection_id) }
    return [...seen]
  }, [movieList])

  const collectionQueries = useQueries({
    queries: collectionIds.map((id) => ({
      queryKey: ['collection', id, TMDB_LANGUAGE[language] ?? 'es-ES'],
      queryFn:  () => fetchCollectionDetail(id, TMDB_LANGUAGE[language] ?? 'es-ES'),
      staleTime: 24 * 60 * 60 * 1000,
    })),
  })

  const completedSagas = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const watchedIds = new Set(movieList.map((m) => m.id))
    return collectionQueries.filter((q) => {
      if (!q.data) return false
      const released = q.data.parts.filter((p) => p.release_date && p.release_date <= today)
      return released.length > 0 && released.every((p) => watchedIds.has(p.id))
    }).length
  }, [collectionQueries, movieList])

  const buckets = useMemo(
    () => period === 'monthly' ? getLast6MonthBuckets(locale) : getLast6Buckets(period, locale),
    [period, locale],
  )
  const chartData: ChartEntry[] = useMemo(
    () => buckets.map(({ name, start, end }) => ({
      name,
      count: movieList.filter((m) => m.watchedAt != null && m.watchedAt >= start && m.watchedAt < end).length,
    })),
    [buckets, movieList],
  )

  const ratingHistogram = useMemo(
    () => buildRatingHistogram(userRatings?.movies ?? {}, userRatings?.series ?? {}),
    [userRatings],
  )
  const decadeData = useMemo(
    () => buildDecadeDistribution(movieList, seriesList),
    [movieList, seriesList],
  )
  const completedSeries = useMemo(
    () => seriesList.filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length >= s.number_of_episodes).length,
    [seriesList, watchedEpisodes],
  )

  const hasContent = movieList.length > 0 || seriesList.length > 0
  const hasRatings = allRatings.length > 0

  return (
    <>
      {tab === 'activity' ? (
        <>
          <div className="flex gap-1.5">
            <StatChip label={t('dashboard.stats.movies')}           value={movieList.length} />
            <StatChip label={t('dashboard.stats.sagas')}            value={completedSagas} />
            <StatChip label={t('dashboard.stats.series')}           value={seriesList.length} />
            <StatChip label={t('dashboard.stats.episodes')}         value={episodeCount} />
            <StatChip label={t('dashboard.stats.seriesCompletion')} value={seriesList.length > 0 ? `${completedSeries}/${seriesList.length}` : '—'} />
          </div>
          <ChartFooter
            chartLabel={t('dashboard.stats.activityChart')} itemLabel={t('dashboard.stats.titles')}
            data={chartData} period={period} onPeriodChange={setPeriod}
            emptyMsg={t('dashboard.stats.noActivity')} hasData={hasContent}
            barColor={barColor} mutedColor={mutedColor}
          />
        </>
      ) : (
        <InsightsTab
          ratingHistogram={ratingHistogram}
          decadeData={decadeData}
          avgRating={avgRating}
          hasRatings={hasRatings}
          hasContent={hasContent}
          barColor={barColor}
          mutedColor={mutedColor}
        />
      )}
    </>
  )
}
