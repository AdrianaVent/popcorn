'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSeriesDetail, fetchSeasonDetail } from '@/features/series/series.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBSeriesDetail, TMDBSeasonDetail } from '@/types/tmdb'

export function useSeriesDetail(id: number | null) {
  const { language } = useLanguageStore()

  const { data: detail, isLoading, isError } = useQuery<TMDBSeriesDetail>({
    queryKey: ['series-detail', id, language],
    queryFn: () => fetchSeriesDetail(id!, language),
    enabled: id !== null,
  })

  const legacyRt = detail?.episode_run_time[0] || null
  const lastEpRt = detail?.last_episode_to_air?.runtime ?? null

  const firstValidSeason = useMemo(() => {
    if (legacyRt != null || lastEpRt != null || !detail) return null
    return detail.seasons.find((s) => s.air_date && s.season_number > 0) ?? null
  }, [detail, legacyRt, lastEpRt])

  const { data: seasonDetail } = useQuery<TMDBSeasonDetail>({
    queryKey: ['series-season-runtime', id, firstValidSeason?.season_number, language],
    queryFn: () => fetchSeasonDetail(id!, firstValidSeason!.season_number, language),
    enabled: firstValidSeason != null,
    staleTime: 5 * 60 * 1000,
  })

  const totalRuntime = useMemo(() => {
    if (!detail) return null
    const validSeasons = (detail.seasons ?? []).filter((s) => s.air_date && s.season_number > 0)
    const numEps = validSeasons.reduce((sum, s) => sum + s.episode_count, 0)
    if (numEps === 0) return null
    let epRt = legacyRt ?? lastEpRt
    if (epRt == null && seasonDetail) {
      const runtimes = seasonDetail.episodes
        .map((e) => e.runtime)
        .filter((r): r is number => r != null && r > 0)
      epRt = runtimes.length > 0
        ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length)
        : null
    }
    return epRt != null ? epRt * numEps : null
  }, [detail, legacyRt, lastEpRt, seasonDetail])

  return { detail: detail ?? null, loading: isLoading, error: isError ? 'TMDB_FETCH_ERROR' : null, totalRuntime }
}
