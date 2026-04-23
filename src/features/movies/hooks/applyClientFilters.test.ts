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
})
