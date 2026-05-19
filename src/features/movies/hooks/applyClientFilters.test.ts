import { applyClientFilters } from './useMovies'
import type { TMDBMovie } from '@/types/tmdb'

const movie = (id: number, vote_average: number): TMDBMovie => ({
  id,
  title: `Movie ${id}`,
  original_title: `Movie ${id}`,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2023-01-01',
  vote_average,
  vote_count: 100,
  popularity: 10,
  genre_ids: [],
  adult: false,
  original_language: 'en',
})

const movies = [movie(1, 8.5), movie(2, 6.0), movie(3, 7.2)]

describe('applyClientFilters', () => {
  it('returns results unchanged when no title filter is active', () => {
    expect(applyClientFilters(movies, {})).toHaveLength(3)
  })

  it('returns results unchanged when title is set but no rating filter', () => {
    // rating filter is only applied client-side in search mode
    expect(applyClientFilters(movies, { title: 'Movie' })).toHaveLength(3)
  })

  it('filters by vote_average when both title and rating are set', () => {
    const result = applyClientFilters(movies, { title: 'Movie', vote_average_gte: 7 })
    expect(result).toHaveLength(2)
    expect(result.map((m) => m.id)).toEqual([1, 3])
  })

  it('returns empty array when no movies meet the rating threshold', () => {
    const result = applyClientFilters(movies, { title: 'Movie', vote_average_gte: 9 })
    expect(result).toHaveLength(0)
  })

  it('returns all when threshold is 0 and title is set', () => {
    const result = applyClientFilters(movies, { title: 'Movie', vote_average_gte: 0 })
    expect(result).toHaveLength(3)
  })

  it('handles empty results array', () => {
    expect(applyClientFilters([], { title: 'Movie', vote_average_gte: 7 })).toEqual([])
  })

  it('does not filter when only vote_average_gte is set (discover handles it)', () => {
    // Without a title, we are in discover mode — TMDB handles the rating filter server-side
    expect(applyClientFilters(movies, { vote_average_gte: 9 })).toHaveLength(3)
  })

  it('filters out non-en/es languages when title filter is active', () => {
    const mixed = [
      movie(1, 8.5),
      { ...movie(2, 6.0), original_language: 'ja' },
      { ...movie(3, 7.2), original_language: 'es' },
    ]
    const result = applyClientFilters(mixed, { title: 'Movie' })
    expect(result).toHaveLength(2)
    expect(result.map((m) => m.id)).toEqual([1, 3])
  })

  it('always filters out non-en/es languages regardless of title filter', () => {
    const mixed = [
      movie(1, 8.5),
      { ...movie(2, 6.0), original_language: 'ja' },
    ]
    expect(applyClientFilters(mixed, {})).toHaveLength(1)
    expect(applyClientFilters(mixed, { title: 'Movie' })).toHaveLength(1)
  })

  it('always filters out movies without a release date', () => {
    const noDate = { ...movie(1, 8.5), release_date: '' }
    expect(applyClientFilters([noDate, movie(2, 7.0)], {})).toHaveLength(1)
  })

  it('always filters out movies without a title', () => {
    const noTitle = { ...movie(1, 8.5), title: '' }
    expect(applyClientFilters([noTitle, movie(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out undated movies even when title and rating filters are active', () => {
    const noDate = { ...movie(1, 8.5), release_date: '' }
    expect(applyClientFilters([noDate], { title: 'Movie', vote_average_gte: 7 })).toHaveLength(0)
  })

  it('filters out movies with Korean original_title even if original_language is en', () => {
    const korean = { ...movie(1, 8.5), original_title: '가나다' } // 가나다
    expect(applyClientFilters([korean, movie(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out movies with CJK original_title even if original_language is en', () => {
    const cjk = { ...movie(1, 8.5), original_title: '寄生虫' } // 寄生虫
    expect(applyClientFilters([cjk, movie(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out movies with Hebrew original_title even if original_language is en', () => {
    const hebrew = { ...movie(1, 8.5), original_title: 'הפרוטוקולים' }
    expect(applyClientFilters([hebrew, movie(2, 7.0)], {})).toHaveLength(1)
  })

  it('filters out movies with Cyrillic original_title even if original_language is en', () => {
    const cyrillic = { ...movie(1, 8.5), original_title: 'Один' } // Один
    expect(applyClientFilters([cyrillic, movie(2, 7.0)], {})).toHaveLength(1)
  })

  it('does not filter movies with accented Latin characters in original_title', () => {
    const spanish = { ...movie(1, 8.5), original_title: 'El señor de los anillos', original_language: 'es' }
    expect(applyClientFilters([spanish], {})).toHaveLength(1)
  })
})
