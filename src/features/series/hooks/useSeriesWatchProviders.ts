'use client'

import { useWatchProviders, type WatchProvidersData } from '@/hooks/useWatchProviders'
import { fetchSeriesWatchProviders } from '@/features/series/series.service'

export type { WatchProvidersData }

export function useSeriesWatchProviders(id: number | null): WatchProvidersData {
  return useWatchProviders(id, fetchSeriesWatchProviders, 'series')
}
