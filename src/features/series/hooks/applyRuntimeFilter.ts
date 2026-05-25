import type { SeriesRow } from '@/types/series'

export function applyRuntimeFilter(
  items: SeriesRow[],
  runtimes: Map<number, number | null>,
  runtimeGte: number | undefined,
): SeriesRow[] {
  if (!runtimeGte || runtimes.size === 0) return items
  return items.filter((s) => {
    const rt = runtimes.get(s.id)
    return rt == null || rt >= runtimeGte
  })
}
