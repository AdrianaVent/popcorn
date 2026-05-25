import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TMDBVideosResult, TMDBVideo } from '@/types/tmdb'

// TMDB language code → ISO 639-1 used in video metadata
const LANG_TO_ISO: Record<string, string> = {
  'es-ES': 'es',
  'en-US': 'en',
}

const SEASON_TITLE_RE = /\b(Season|Temporada)\s+(\d+)\b/i

export function findSeasonTrailerInList(trailers: TMDBVideo[], seasonNumber: number): TMDBVideo | null {
  return trailers.find((v) => {
    const match = v.name.match(SEASON_TITLE_RE)
    return match !== null && parseInt(match[2], 10) === seasonNumber
  }) ?? null
}

export function filterNonSeasonTrailers(trailers: TMDBVideo[]): TMDBVideo[] {
  return trailers.filter((v) => !SEASON_TITLE_RE.test(v.name))
}

export function resolveSeasonFallback(allTrailers: TMDBVideo[], seasonNumber: number): TMDBVideo | null {
  return findSeasonTrailerInList(allTrailers, seasonNumber)
}

async function fetchYouTubeTitle(key: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${key}&format=json`,
    )
    if (!res.ok) return null
    const json = await res.json() as { title?: string }
    return json.title ?? null
  } catch {
    return null
  }
}

export function useEnrichedTrailers(trailers: TMDBVideo[]): TMDBVideo[] {
  const keys = trailers.map((t) => t.key)
  const { data } = useQuery<Record<string, string | null>>({
    queryKey: ['yt-titles', ...keys.slice().sort()],
    queryFn: async () => {
      const results = await Promise.allSettled(trailers.map((t) => fetchYouTubeTitle(t.key)))
      return Object.fromEntries(
        trailers.map((t, i) => {
          const r = results[i]
          return [t.key, r.status === 'fulfilled' ? r.value : null]
        }),
      )
    },
    enabled: keys.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  })

  return useMemo(
    () => trailers.map((t) => ({ ...t, name: data?.[t.key] ?? t.name })),
    [trailers, data],
  )
}

export function resolveHeaderTrailer(allTrailers: TMDBVideo[], preferredLang?: string): TMDBVideo | null {
  return pickYouTubeTrailer(filterNonSeasonTrailers(allTrailers), preferredLang)
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
    queryKey: ['raw', ...queryKey],
    queryFn: fetcher,
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const allTrailers = useMemo(
    () => (data?.results ?? []).filter((v) => v.site === 'YouTube' && v.type === 'Trailer'),
    [data],
  )
  const trailer = useMemo(
    () => pickYouTubeTrailer(data?.results ?? [], preferredLang),
    [data, preferredLang],
  )
  return { trailer, allTrailers, isLoading }
}
