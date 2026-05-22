import { useQuery } from '@tanstack/react-query'
import type { TMDBVideosResult, TMDBVideo } from '@/types/tmdb'

// TMDB language code → ISO 639-1 used in video metadata
const LANG_TO_ISO: Record<string, string> = {
  'es-ES': 'es',
  'en-US': 'en',
}

export function pickYouTubeTrailer(videos: TMDBVideo[], preferredLang?: string): TMDBVideo | null {
  const trailers = videos.filter((v) => v.site === 'YouTube' && v.type === 'Trailer')
  if (preferredLang) {
    const iso = LANG_TO_ISO[preferredLang] ?? preferredLang
    const preferred = trailers.find((v) => v.iso_639_1 === iso)
    if (preferred) return preferred
  }
  return trailers[0] ?? null
}

export function useTrailer(
  queryKey: unknown[],
  fetcher: () => Promise<TMDBVideosResult>,
  enabled: boolean,
  preferredLang?: string,
) {
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetcher()
      return pickYouTubeTrailer(res.results, preferredLang)
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
  return { trailer: data ?? null, isLoading }
}
