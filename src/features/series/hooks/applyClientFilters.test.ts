import { applyClientFilters } from './useSeries'
import type { TMDBSeries } from '@/types/tmdb'

const series = (id: number, vote_average: number): TMDBSeries => ({
  id,
  name: `Series ${id}`,
  original_name: `Series ${id}`,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  first_air_date: '2023-01-01',
  vote_average,
  vote_count: 100,
  popularity: 10,
  genre_ids: [],
  origin_country: ['US'],
  original_language: 'en',
})

const items = [series(1, 8.5), series(2, 6.0), series(3, 7.2)]

describe('applyClientFilters (series)', () => {
  it('returns results unchanged when no title filter is active', () => {
    expect(applyClientFilters(items, {})).toHaveLength(3)
  })

  it('returns results unchanged when title is set but no rating filter', () => {
    expect(applyClientFilters(items, { title: 'Series' })).toHaveLength(3)
  })

  it('filters by vote_average when both title and rating are set', () => {
    const result = applyClientFilters(items, { title: 'Series', vote_average_gte: 7 })
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.id)).toEqual([1, 3])
  })

  it('returns empty array when no series meet the rating threshold', () => {
    const result = applyClientFilters(items, { title: 'Series', vote_average_gte: 9 })
    expect(result).toHaveLength(0)
  })

  it('returns all when threshold is 0 and title is set', () => {
    const result = applyClientFilters(items, { title: 'Series', vote_average_gte: 0 })
    expect(result).toHaveLength(3)
  })

  it('handles empty results array', () => {
    expect(applyClientFilters([], { title: 'Series', vote_average_gte: 7 })).toEqual([])
  })

  it('does not filter when only vote_average_gte is set (discover handles it server-side)', () => {
    expect(applyClientFilters(items, { vote_average_gte: 9 })).toHaveLength(3)
  })

  it('filters out non-en/es languages when title filter is active', () => {
    const mixed = [
      series(1, 8.5),
      { ...series(2, 6.0), original_language: 'ko' },
      { ...series(3, 7.2), original_language: 'es' },
    ]
    const result = applyClientFilters(mixed, { title: 'Series' })
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.id)).toEqual([1, 3])
  })

  it('does not apply language filter when no title is set', () => {
    const mixed = [
      series(1, 8.5),
      { ...series(2, 6.0), original_language: 'ko' },
    ]
    expect(applyClientFilters(mixed, {})).toHaveLength(2)
  })

  it('always filters out series without a first air date', () => {
    const noDate = { ...series(1, 8.5), first_air_date: '' }
    expect(applyClientFilters([noDate, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out undated series even when title and rating filters are active', () => {
    const noDate = { ...series(1, 8.5), first_air_date: '' }
    expect(applyClientFilters([noDate], { title: 'Series', vote_average_gte: 7 })).toHaveLength(0)
  })
})
