import type { GenreEntry } from './useMovieGenres'

const TOP_N = 10

export function buildGenreCounts(
  entries: Array<{ name: string }[]>,
): GenreEntry[] {
  const counts: Record<string, number> = {}
  entries.forEach((genres) => {
    const seen = new Set<string>()
    genres.forEach(({ name }) => {
      if (seen.has(name)) return
      seen.add(name)
      counts[name] = (counts[name] ?? 0) + 1
    })
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)
}
