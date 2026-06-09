import { useQuery } from '@tanstack/react-query'
import { releasesService, type ReleaseEntry } from '@/services/tmdb/releases'
import { seriesService } from '@/services/tmdb'
import { fetchWatchProviderOptions } from '@/utils/watchProviders'
import { useLanguageStore } from '@/store/languageStore'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import type { WatchProvider } from '@/types/tmdb'

export function useMovieReleases(year: number, month: number) {
  const region = useLanguageStore((s) => s.region)
  const language = useLanguageStore((s) => TMDB_LANGUAGE[s.language] ?? 'es-ES')

  return useQuery<ReleaseEntry[]>({
    queryKey: ['movie-releases', year, month, region, language],
    queryFn: () => releasesService.movies(year, month, region, language),
    staleTime: 60 * 60 * 1000,
  })
}

export function useSeriesProviderIds(): string | undefined {
  const region = useLanguageStore((s) => s.region)
  const { data: providers } = useQuery<WatchProvider[]>({
    queryKey: ['series-provider-options', region],
    queryFn: () => fetchWatchProviderOptions(seriesService, region),
    staleTime: Infinity,
  })
  return providers?.map((p) => p.provider_id).join('|')
}

export function useSeriesReleases(year: number, month: number) {
  const region = useLanguageStore((s) => s.region)
  const language = useLanguageStore((s) => TMDB_LANGUAGE[s.language] ?? 'es-ES')
  const providerIds = useSeriesProviderIds()

  return useQuery<ReleaseEntry[]>({
    queryKey: ['series-releases', year, month, region, language, providerIds],
    queryFn: () => releasesService.series(year, month, providerIds!, region, language),
    staleTime: 60 * 60 * 1000,
    enabled: !!providerIds,
  })
}
