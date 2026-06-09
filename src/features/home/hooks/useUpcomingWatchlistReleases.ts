import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { releasesService, type ReleaseEntry } from '@/services/tmdb/releases'
import { useLanguageStore } from '@/store/languageStore'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { localToday } from '@/utils/formatDate'
import { useSeriesProviderIds } from './useReleases'

function getUpcomingMonths(count = 3) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
}

export function useUpcomingWatchlistReleases(
  watchlistMovieIds: Set<number>,
  watchlistSeriesIds: Set<number>,
) {
  const region      = useLanguageStore((s) => s.region)
  const language    = useLanguageStore((s) => TMDB_LANGUAGE[s.language] ?? 'es-ES')
  const providerIds = useSeriesProviderIds()

  const months = useMemo(() => getUpcomingMonths(3), [])
  const today  = useMemo(() => localToday(), [])

  const movieQueries = useQueries({
    queries: months.map(({ year, month }) => ({
      queryKey: ['movie-releases', year, month, region, language],
      queryFn: () => releasesService.movies(year, month, region, language),
      staleTime: 60 * 60 * 1000,
    })),
  })

  const seriesQueries = useQueries({
    queries: months.map(({ year, month }) => ({
      queryKey: ['series-releases', year, month, region, language, providerIds],
      queryFn: () => releasesService.series(year, month, providerIds!, region, language),
      staleTime: 60 * 60 * 1000,
      enabled: !!providerIds,
    })),
  })

  const isLoading = movieQueries.some((q) => q.isLoading) || seriesQueries.some((q) => q.isLoading)
  const isError   = movieQueries.some((q) => q.isError)   || seriesQueries.some((q) => q.isError)

  const entries = useMemo<ReleaseEntry[]>(() => {
    const movieEntries = movieQueries
      .flatMap((q) => q.data ?? [])
      .filter((e) => watchlistMovieIds.has(e.id) && !!e.date && e.date >= today)

    const seriesEntries = seriesQueries
      .flatMap((q) => q.data ?? [])
      .filter((e) => watchlistSeriesIds.has(e.id) && !!e.date && e.date >= today)

    const seen = new Set<number>()
    return [...movieEntries, ...seriesEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((e) => {
        if (seen.has(e.id)) return false
        seen.add(e.id)
        return true
      })
  }, [movieQueries, seriesQueries, watchlistMovieIds, watchlistSeriesIds, today])

  return { entries, isLoading, isError }
}
