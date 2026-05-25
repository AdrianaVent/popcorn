import { renderHook, waitFor } from '@testing-library/react'
import { useMovieRuntimeEnrichment } from './useMovieRuntimeEnrichment'
import { fetchMovieDetail } from '@/features/movies/movies.service'
import type { MovieRow } from '@/types/movie'
import type { TMDBMovieDetail } from '@/types/tmdb'

jest.mock('@/features/movies/movies.service', () => ({
  fetchMovieDetail: jest.fn(),
}))

const mockFetchDetail = fetchMovieDetail as jest.MockedFunction<typeof fetchMovieDetail>

const makeRow = (id: number): MovieRow => ({
  id,
  title: `Movie ${id}`,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 500,
  poster_path: null,
  original_language: 'en',
  genre_ids: [],
})

const makeDetail = (overrides: Partial<TMDBMovieDetail> = {}): TMDBMovieDetail => ({
  id: 1,
  title: 'Test Movie',
  original_title: 'Test Movie',
  overview: '',
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 500,
  poster_path: null,
  original_language: 'en',
  genre_ids: [],
  runtime: 120,
  genres: [],
  status: 'Released',
  tagline: '',
  ...overrides,
} as TMDBMovieDetail)

describe('useMovieRuntimeEnrichment', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty map when movies is empty', () => {
    const { result } = renderHook(() => useMovieRuntimeEnrichment([], 'en'))
    expect(result.current.size).toBe(0)
  })

  it('populates runtime from detail', async () => {
    mockFetchDetail.mockResolvedValueOnce(makeDetail({ id: 1, runtime: 90 }))

    const movies = [makeRow(1)]
    const { result } = renderHook(() => useMovieRuntimeEnrichment(movies, 'en'))
    await waitFor(() => expect(result.current.size).toBe(1))

    expect(result.current.get(1)).toBe(90)
  })

  it('sets runtime to null when detail has no runtime', async () => {
    mockFetchDetail.mockResolvedValueOnce(makeDetail({ id: 1, runtime: undefined }))

    const movies = [makeRow(1)]
    const { result } = renderHook(() => useMovieRuntimeEnrichment(movies, 'en'))
    await waitFor(() => expect(result.current.size).toBe(1))

    expect(result.current.get(1)).toBeNull()
  })

  it('sets runtime to null when fetch fails', async () => {
    mockFetchDetail.mockRejectedValueOnce(new Error('network error'))

    const movies = [makeRow(1)]
    const { result } = renderHook(() => useMovieRuntimeEnrichment(movies, 'en'))
    await waitFor(() => expect(result.current.size).toBe(1))

    expect(result.current.get(1)).toBeNull()
  })

  it('enriches multiple movies independently', async () => {
    mockFetchDetail
      .mockResolvedValueOnce(makeDetail({ id: 1, runtime: 100 }))
      .mockResolvedValueOnce(makeDetail({ id: 2, runtime: 145 }))

    const movies = [makeRow(1), makeRow(2)]
    const { result } = renderHook(() => useMovieRuntimeEnrichment(movies, 'en'))
    await waitFor(() => expect(result.current.size).toBe(2))

    expect(result.current.get(1)).toBe(100)
    expect(result.current.get(2)).toBe(145)
  })

  it('handles mixed success and failure across movies', async () => {
    mockFetchDetail
      .mockResolvedValueOnce(makeDetail({ id: 1, runtime: 120 }))
      .mockRejectedValueOnce(new Error('network error'))

    const movies = [makeRow(1), makeRow(2)]
    const { result } = renderHook(() => useMovieRuntimeEnrichment(movies, 'en'))
    await waitFor(() => expect(result.current.size).toBe(2))

    expect(result.current.get(1)).toBe(120)
    expect(result.current.get(2)).toBeNull()
  })
})
