import type { SeriesRow } from '@/types/series'

export function applyRuntimeFilter(
  items: SeriesRow[],
  runtimes: Map<number, number | null>,
  runtime_gte: number | undefined,
): SeriesRow[] {
  if (!runtime_gte || runtimes.size === 0) return items
  return items.filter((s) => {
    const rt = runtimes.get(s.id)
    return rt == null || rt >= runtime_gte
  })
}
