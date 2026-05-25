import { applyRuntimeFilter } from './applyRuntimeFilter'
import type { SeriesRow } from '@/types/series'

const makeRow = (id: number): SeriesRow => ({
  id,
  name: `Series ${id}`,
  first_air_date: '2020-01-01',
  vote_average: 7,
  vote_count: 500,
  poster_path: null,
  original_language: 'en',
})

const items = [makeRow(1), makeRow(2), makeRow(3)]

describe('applyRuntimeFilter', () => {
  it('returns items unchanged when runtime_gte is undefined', () => {
    const runtimes = new Map([[1, 100], [2, 200], [3, 300]])
    expect(applyRuntimeFilter(items, runtimes, undefined)).toBe(items)
  })

  it('returns items unchanged when runtime_gte is 0', () => {
    const runtimes = new Map([[1, 100], [2, 200], [3, 300]])
    expect(applyRuntimeFilter(items, runtimes, 0)).toBe(items)
  })

  it('returns items unchanged when runtimes map is empty (enrichment not done)', () => {
    const runtimes = new Map<number, number | null>()
    expect(applyRuntimeFilter(items, runtimes, 200)).toBe(items)
  })

  it('filters out items below threshold', () => {
    const runtimes = new Map<number, number | null>([[1, 100], [2, 250], [3, 400]])
    const result = applyRuntimeFilter(items, runtimes, 200)
    expect(result.map((s) => s.id)).toEqual([2, 3])
  })

  it('keeps items at exactly the threshold', () => {
    const runtimes = new Map<number, number | null>([[1, 200], [2, 199]])
    const result = applyRuntimeFilter([makeRow(1), makeRow(2)], runtimes, 200)
    expect(result.map((s) => s.id)).toEqual([1])
  })

  it('passes through items with rt == null (enrichment pending)', () => {
    const runtimes = new Map<number, number | null>([[1, null], [2, 50], [3, 300]])
    const result = applyRuntimeFilter(items, runtimes, 200)
    expect(result.map((s) => s.id)).toEqual([1, 3])
  })

  it('passes through items not yet in the runtimes map', () => {
    const runtimes = new Map<number, number | null>([[2, 50]])
    const result = applyRuntimeFilter(items, runtimes, 200)
    // only id=2 is known and below threshold → filtered; 1 and 3 are unknown → pass through
    expect(result.map((s) => s.id)).toEqual([1, 3])
  })

  it('returns empty array when all items are below threshold', () => {
    const runtimes = new Map<number, number | null>([[1, 10], [2, 20], [3, 30]])
    expect(applyRuntimeFilter(items, runtimes, 200)).toHaveLength(0)
  })

  it('handles empty items array', () => {
    const runtimes = new Map<number, number | null>([[1, 300]])
    expect(applyRuntimeFilter([], runtimes, 200)).toEqual([])
  })
})
