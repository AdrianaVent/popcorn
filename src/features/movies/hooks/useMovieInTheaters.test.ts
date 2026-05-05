import { renderHook, waitFor } from '@testing-library/react'
import { useMovieInTheaters } from './useMovieInTheaters'
import { moviesService } from '@/services/tmdb/movies'
import type { ReleaseDatesResult } from '@/types/tmdb'

jest.mock('@/services/tmdb/movies', () => ({
  moviesService: { releaseDates: jest.fn() },
}))

const mockReleaseDates = moviesService.releaseDates as jest.MockedFunction<typeof moviesService.releaseDates>

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

function makeResult(releaseDates: { release_date: string; type: number }[]): ReleaseDatesResult {
  return { results: [{ iso_3166_1: 'ES', release_dates: releaseDates }] }
}

describe('useMovieInTheaters', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not fetch when id is null', () => {
    renderHook(() => useMovieInTheaters(null))
    expect(mockReleaseDates).not.toHaveBeenCalled()
  })

  it('returns false when there is no ES region', async () => {
    mockReleaseDates.mockResolvedValueOnce({ results: [] })
    const { result } = renderHook(() => useMovieInTheaters(1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.inTheaters).toBe(false)
  })

  it('returns false when there is no type 3 release', async () => {
    mockReleaseDates.mockResolvedValueOnce(
      makeResult([{ release_date: daysAgo(10), type: 4 }]),
    )
    const { result } = renderHook(() => useMovieInTheaters(1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.inTheaters).toBe(false)
  })

  it('returns true when type 3 release is within 90 days', async () => {
    mockReleaseDates.mockResolvedValueOnce(
      makeResult([{ release_date: daysAgo(30), type: 3 }]),
    )
    const { result } = renderHook(() => useMovieInTheaters(1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.inTheaters).toBe(true)
  })

  it('returns false when type 3 release is older than 90 days', async () => {
    mockReleaseDates.mockResolvedValueOnce(
      makeResult([{ release_date: daysAgo(91), type: 3 }]),
    )
    const { result } = renderHook(() => useMovieInTheaters(1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.inTheaters).toBe(false)
  })

  it('returns false when type 3 release is in the future', async () => {
    const future = new Date(Date.now() + 10 * 86_400_000).toISOString()
    mockReleaseDates.mockResolvedValueOnce(
      makeResult([{ release_date: future, type: 3 }]),
    )
    const { result } = renderHook(() => useMovieInTheaters(1))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.inTheaters).toBe(false)
  })

  it('starts in loading state', () => {
    mockReleaseDates.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useMovieInTheaters(1))
    expect(result.current.loading).toBe(true)
  })
})
