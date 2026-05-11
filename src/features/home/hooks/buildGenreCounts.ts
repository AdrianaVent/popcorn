import type { GenreEntry } from './useMovieGenres'

const TOP_N = 10

export function buildGenreCounts(
  entries: Array<{ name: string }[]>,
): GenreEntry[] {
  const counts: Record<string, number> = {}
  entries.forEach((genres) => {
    genres.forEach(({ name }) => {
      counts[name] = (counts[name] ?? 0) + 1
    })
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)
}
