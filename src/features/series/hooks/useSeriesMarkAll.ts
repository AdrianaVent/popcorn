import { useState, useCallback } from 'react'
import { fetchSeasonDetail } from '@/features/series/series.service'
import { useWatchedStore } from '@/store/watchedStore'
import type { TMDBSeason } from '@/types/tmdb'
import type { StoredSeries } from '@/store/watchedStore'

export function useSeriesMarkAll(
  seriesId: number,
  validSeasons: TMDBSeason[],
  userKey: string,
  seriesSnapshot: StoredSeries | undefined,
  language: string,
) {
  const [markLoading, setMarkLoading] = useState(false)
  const markSeason = useWatchedStore((s) => s.markSeason)

  const handleMarkAll = useCallback(async () => {
    if (markLoading) return
    setMarkLoading(true)
    try {
      const results = await Promise.allSettled(
        validSeasons.map((s) => fetchSeasonDetail(seriesId, s.season_number, language))
      )
      const today   = new Date().toISOString().slice(0, 10)
      const storeEps = useWatchedStore.getState().episodes[userKey]?.[seriesId] ?? {}
      const fulfilled = results
        .map((result, i) => {
          if (result.status !== 'fulfilled') return null
          const epIds = result.value.episodes
            .filter((e) => e.air_date && e.air_date <= today && e.runtime != null)
            .map((e) => e.id)
          return epIds.length > 0 ? { season: validSeasons[i]!, epIds } : null
        })
        .filter((x): x is { season: TMDBSeason; epIds: number[] } => x !== null)

      const allDone = fulfilled.every(({ epIds }) => epIds.every((id) => !!storeEps[id]))
      fulfilled.forEach(({ season, epIds }) => {
        const seasonDone = epIds.every((id) => !!storeEps[id])
        if (allDone || !seasonDone) markSeason(userKey, seriesId, season.season_number, epIds, seriesSnapshot)
      })
    } finally {
      setMarkLoading(false)
    }
  }, [markLoading, seriesId, validSeasons, language, userKey, seriesSnapshot, markSeason])

  return { markLoading, handleMarkAll }
}
