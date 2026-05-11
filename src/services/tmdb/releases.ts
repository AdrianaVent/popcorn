import { tmdbFetch } from './client'

export type ReleaseEntry = {
  id: number
  title: string
  date: string
  poster_path: string | null
  overview: string | null
  genre_ids: number[]
  season_number?: number
  episode_count?: number
  series_status?: string
}

function monthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, month, 0).getDate()
  return { gte: `${year}-${pad(month)}-01`, lte: `${year}-${pad(month)}-${pad(daysInMonth)}` }
}

async function fetchAllPages<R>(
  endpoint: string,
  params: Record<string, string | number | boolean>,
  maxPages = 5
): Promise<R[]> {
  const first = await tmdbFetch<{ results: R[]; total_pages: number }>(endpoint, { ...params, page: 1 })
  const extraPages = Math.min(first.total_pages - 1, maxPages - 1)
  if (extraPages <= 0) return first.results

  const rest = await Promise.allSettled(
    Array.from({ length: extraPages }, (_, i) =>
      tmdbFetch<{ results: R[] }>(endpoint, { ...params, page: i + 2 })
    )
  )
  return [
    ...first.results,
    ...rest.flatMap((r) => (r.status === 'fulfilled' ? r.value.results : [])),
  ]
}

async function batchSettled<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 20
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = await Promise.allSettled(items.slice(i, i + batchSize).map(fn))
    results.push(...batch)
  }
  return results
}

type TMDBMovie  = { id: number; title: string; release_date: string; poster_path: string | null; overview: string; genre_ids: number[] }
type TMDBSeriesListing = { id: number; name: string; poster_path: string | null; overview: string; genre_ids: number[] }
type TMDBSeasonInfo = { air_date: string | null; episode_count: number; season_number: number }
type TMDBSeriesInfo = { status: string; seasons: TMDBSeasonInfo[] }

// TMDB occasionally has duplicate entries for the same film with different IDs.
// Dedup by title+date, preferring the entry that has a poster.
function dedup(entries: ReleaseEntry[]): ReleaseEntry[] {
  const byId = new Map<number, ReleaseEntry>()
  for (const entry of entries) {
    const existing = byId.get(entry.id)
    if (!existing || (entry.poster_path && !existing.poster_path)) {
      byId.set(entry.id, entry)
    }
  }
  const byTitleDate = new Map<string, ReleaseEntry>()
  for (const entry of byId.values()) {
    const key = `${entry.title.toLowerCase().trim()}|${entry.date}`
    const existing = byTitleDate.get(key)
    if (!existing || (entry.poster_path && !existing.poster_path)) {
      byTitleDate.set(key, entry)
    }
  }
  return [...byTitleDate.values()]
}

export const releasesService = {
  movies: async (year: number, month: number, region: string, language: string): Promise<ReleaseEntry[]> => {
    const { gte, lte } = monthRange(year, month)
    const results = await fetchAllPages<TMDBMovie>('/discover/movie', {
      'release_date.gte': gte,
      'release_date.lte': lte,
      with_release_type: '2|3',
      region,
      language,
      sort_by: 'release_date.asc',
    })
    const mapped = results.map((m) => ({ id: m.id, title: m.title, date: m.release_date, poster_path: m.poster_path, overview: m.overview || null, genre_ids: m.genre_ids ?? [] }))
    return dedup(mapped)
  },

  series: async (year: number, month: number, providerIds: string, region: string, language: string): Promise<ReleaseEntry[]> => {
    const { gte, lte } = monthRange(year, month)
    // Cap at 2 pages (40 results) — popularity.desc ensures the most relevant series come first,
    // and each result triggers an extra /tv/{id} call so we keep the total requests manageable.
    const results = await fetchAllPages<TMDBSeriesListing>('/discover/tv', {
      'air_date.gte': gte,
      'air_date.lte': lte,
      with_watch_providers: providerIds,
      watch_region: region,
      language,
      sort_by: 'popularity.desc',
    }, 2)

    // Batch detail fetches (20 at a time) to stay within TMDB rate limits
    const detailResults = await batchSettled(
      results,
      (s) => tmdbFetch<TMDBSeriesInfo>(`/tv/${s.id}`, { language })
    )

    const entries: ReleaseEntry[] = []
    for (let i = 0; i < results.length; i++) {
      const s = results[i]
      const detail = detailResults[i]
      if (detail.status !== 'fulfilled') continue

      // Find the season (excluding specials) whose premiere falls in the queried month
      const season = detail.value.seasons
        .filter((se) => se.season_number > 0 && se.air_date && se.air_date >= gte && se.air_date <= lte)
        .sort((a, b) => b.season_number - a.season_number)[0]

      if (!season?.air_date) continue

      entries.push({
        id: s.id,
        title: s.name,
        date: season.air_date,
        poster_path: s.poster_path,
        overview: s.overview || null,
        genre_ids: s.genre_ids ?? [],
        season_number: season.season_number,
        episode_count: season.episode_count,
        series_status: detail.value.status,
      })
    }

    return dedup(entries)
  },
}
