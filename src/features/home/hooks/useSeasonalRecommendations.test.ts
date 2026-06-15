import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSeasonalRecommendations } from './useSeasonalRecommendations'
import type { TMDBMovie, TMDBSeries } from '@/types/tmdb'

const mockMoviesDiscover = jest.fn()
const mockSeriesDiscover = jest.fn()

jest.mock('@/services/tmdb/movies', () => ({
  moviesService: { discover: (...args: unknown[]) => mockMoviesDiscover(...args) },
}))

jest.mock('@/services/tmdb/series', () => ({
  seriesService: { discover: (...args: unknown[]) => mockSeriesDiscover(...args) },
}))

const MOVIE_STUB: TMDBMovie = {
  id: 1, title: 'Test Movie', overview: '', poster_path: null, backdrop_path: null,
  original_title: '', popularity: 1, adult: false, original_language: 'en',
  release_date: '2024-01-01', vote_average: 7.5, vote_count: 200, genre_ids: [878],
}

const SERIES_STUB: TMDBSeries = {
  id: 2, name: 'Test Series', overview: '', poster_path: null, backdrop_path: null,
  original_name: '', popularity: 1, origin_country: ['US'], original_language: 'en',
  first_air_date: '2024-01-01', vote_average: 8.0, vote_count: 300, genre_ids: [10765],
}

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children)
  }
  return Wrapper
}

beforeEach(() => {
  mockMoviesDiscover.mockResolvedValue({ results: [MOVIE_STUB] })
  mockSeriesDiscover.mockResolvedValue({ results: [SERIES_STUB] })
})

afterEach(() => {
  mockMoviesDiscover.mockClear()
  mockSeriesDiscover.mockClear()
})

describe('useSeasonalRecommendations', () => {
  it('fetches 5 pages of movies and series in parallel', async () => {
    renderHook(() => useSeasonalRecommendations(1, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockMoviesDiscover).toHaveBeenCalledTimes(5))
    expect(mockSeriesDiscover).toHaveBeenCalledTimes(5)
  })

  it('passes correct movie genres for the given month', async () => {
    renderHook(() => useSeasonalRecommendations(1, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockMoviesDiscover).toHaveBeenCalled())
    const [, , params] = mockMoviesDiscover.mock.calls[0] as [number, string, Record<string, unknown>]
    expect(params.with_genres).toBe('878|10752') // January: Sci-Fi + War
  })

  it('passes correct series genres for the given month', async () => {
    renderHook(() => useSeasonalRecommendations(1, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockSeriesDiscover).toHaveBeenCalled())
    const [, , params] = mockSeriesDiscover.mock.calls[0] as [number, string, Record<string, unknown>]
    expect(params.with_genres).toBe('10765|10768') // January: Sci-Fi & Fantasy + War & Politics
  })

  it('does not pass without_genres when seriesExcludeGenres is not defined', async () => {
    renderHook(() => useSeasonalRecommendations(1, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockSeriesDiscover).toHaveBeenCalled())
    const [, , params] = mockSeriesDiscover.mock.calls[0] as [number, string, Record<string, unknown>]
    expect(params.without_genres).toBeUndefined()
  })

  it('passes without_genres for february (seriesExcludeGenres defined)', async () => {
    renderHook(() => useSeasonalRecommendations(2, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockSeriesDiscover).toHaveBeenCalled())
    const [, , params] = mockSeriesDiscover.mock.calls[0] as [number, string, Record<string, unknown>]
    expect(params.without_genres).toBe('10765,9648,10759,80,10768')
  })

  it('passes without_genres for april (seriesExcludeGenres defined)', async () => {
    renderHook(() => useSeasonalRecommendations(4, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockSeriesDiscover).toHaveBeenCalled())
    const [, , params] = mockSeriesDiscover.mock.calls[0] as [number, string, Record<string, unknown>]
    expect(params.without_genres).toBe('10768,10759,80,99')
  })

  it('flattens results from all pages', async () => {
    mockMoviesDiscover.mockResolvedValue({ results: [MOVIE_STUB] })
    const { result } = renderHook(() => useSeasonalRecommendations(1, 'en'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.movies).toHaveLength(5) // 1 result × 5 pages
  })

  it('returns empty arrays while loading', () => {
    mockMoviesDiscover.mockReturnValue(new Promise(() => {}))
    mockSeriesDiscover.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useSeasonalRecommendations(6, 'es'), { wrapper: makeWrapper() })
    expect(result.current.movies).toEqual([])
    expect(result.current.series).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('returns isLoading false once both queries resolve', async () => {
    const { result } = renderHook(() => useSeasonalRecommendations(10, 'es'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})
