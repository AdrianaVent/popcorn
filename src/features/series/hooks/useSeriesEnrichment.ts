'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchSeriesDetail, fetchSeasonDetail } from '@/features/series/series.service'
import type { SeriesRow } from '@/types/series'

type EnrichmentResult = {
  statuses: Map<number, string>
  totals: Map<number, number>
  runtimes: Map<number, number | null>
}

export function useSeriesEnrichment(visibleSeries: SeriesRow[], language: string): EnrichmentResult {
  const [statuses, setStatuses] = useState<Map<number, string>>(new Map())
  const [totals, setTotals] = useState<Map<number, number>>(new Map())
  const [runtimes, setRuntimes] = useState<Map<number, number | null>>(new Map())
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!visibleSeries.length) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    Promise.allSettled(
      visibleSeries.map(async (s) => {
        const detail = await fetchSeriesDetail(s.id, language)
        const validSeasons = (detail.seasons ?? []).filter((vs) => vs.air_date && vs.season_number > 0)
        const numEps = validSeasons.reduce((sum, vs) => sum + vs.episode_count, 0)
        const legacyRt = detail.episode_run_time?.[0] || null
        let epRt = legacyRt ?? detail.last_episode_to_air?.runtime ?? null
        if (epRt == null && validSeasons.length > 0) {
          try {
            const seasonDetail = await fetchSeasonDetail(s.id, validSeasons[0].season_number, language)
            const knownRuntimes = seasonDetail.episodes
              .map((e) => e.runtime)
              .filter((r): r is number => r != null && r > 0)
            if (knownRuntimes.length > 0) {
              epRt = Math.round(knownRuntimes.reduce((a: number, b: number) => a + b, 0) / knownRuntimes.length)
            }
          } catch { /* ignore */ }
        }
        return { id: s.id, detail, numEps, epRt }
      })
    ).then((results) => {
      if (controller.signal.aborted) return
      const nextStatuses = new Map<number, string>()
      const nextTotals = new Map<number, number>()
      const nextRuntimes = new Map<number, number | null>()
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { id, detail, numEps, epRt } = result.value
          if (detail.status) nextStatuses.set(id, detail.status)
          if (numEps) nextTotals.set(id, numEps)
          nextRuntimes.set(id, epRt != null && numEps > 0 ? epRt * numEps : null)
        }
      })
      setStatuses(nextStatuses)
      setTotals(nextTotals)
      setRuntimes(nextRuntimes)
    })

    return () => { controller.abort() }
  }, [visibleSeries, language])

  return { statuses, totals, runtimes }
}
