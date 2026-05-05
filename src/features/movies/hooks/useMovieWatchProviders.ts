'use client'

import { useWatchProviders, type WatchProvidersData } from '@/hooks/useWatchProviders'
import { fetchMovieWatchProviders } from '@/features/movies/movies.service'

export type { WatchProvidersData }

export function useMovieWatchProviders(id: number | null): WatchProvidersData {
  return useWatchProviders(id, fetchMovieWatchProviders)
}
