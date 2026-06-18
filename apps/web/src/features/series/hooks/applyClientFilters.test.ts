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

  it('always filters out non-en/es languages regardless of title filter', () => {
    const mixed = [
      series(1, 8.5),
      { ...series(2, 6.0), original_language: 'ko' },
    ]
    expect(applyClientFilters(mixed, {})).toHaveLength(1)
    expect(applyClientFilters(mixed, { title: 'Series' })).toHaveLength(1)
  })

  it('always filters out series without a first air date', () => {
    const noDate = { ...series(1, 8.5), first_air_date: '' }
    expect(applyClientFilters([noDate, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('always filters out series without a name', () => {
    const noName = { ...series(1, 8.5), name: '' }
    expect(applyClientFilters([noName, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out undated series even when title and rating filters are active', () => {
    const noDate = { ...series(1, 8.5), first_air_date: '' }
    expect(applyClientFilters([noDate], { title: 'Series', vote_average_gte: 7 })).toHaveLength(0)
  })

  it('filters out series with Korean original_name even if original_language is en', () => {
    const korean = { ...series(1, 8.5), original_name: '오징어 게임' }
    expect(applyClientFilters([korean, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out series with CJK original_name even if original_language is en', () => {
    const cjk = { ...series(1, 8.5), original_name: '鬼滅の刃' }
    expect(applyClientFilters([cjk, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out series with Hebrew original_name even if original_language is en', () => {
    const hebrew = { ...series(1, 8.5), original_name: 'הפרוטוקולים' }
    expect(applyClientFilters([hebrew, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out series with Cyrillic original_name even if original_language is en', () => {
    const cyrillic = { ...series(1, 8.5), original_name: 'Один' }
    expect(applyClientFilters([cyrillic, series(2, 7.0)], {})).toHaveLength(1)
  })

  it('does not filter series with accented Latin characters in original_name', () => {
    const spanish = { ...series(1, 8.5), original_name: 'La casa de papel', original_language: 'es' }
    expect(applyClientFilters([spanish], {})).toHaveLength(1)
  })
})
