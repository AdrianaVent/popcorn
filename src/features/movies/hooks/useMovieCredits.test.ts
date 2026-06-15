import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMovieCredits } from './useMovieCredits'
import { fetchMovieCredits } from '@/features/movies/movies.service'
import type { TMDBCredits } from '@/types/tmdb'

jest.mock('@/features/movies/movies.service', () => ({
  fetchMovieCredits: jest.fn(),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const mockFetch = fetchMovieCredits as jest.MockedFunction<typeof fetchMovieCredits>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

const mockCredits: TMDBCredits = {
  cast: [
    { id: 1, name: 'Actor One', character: 'Hero', profile_path: '/a1.jpg', order: 0 },
    { id: 2, name: 'Actor Two', character: 'Villain', profile_path: null, order: 1 },
  ],
  crew: [
    { id: 10, name: 'Jane Director', job: 'Director', department: 'Directing', profile_path: null },
  ],
}

describe('useMovieCredits', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty arrays and does not fetch when id is null', () => {
    const { result } = renderHook(() => useMovieCredits(null), { wrapper: createWrapper() })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current).toEqual({ cast: [], crew: [] })
  })

  it('returns cast and crew on success', async () => {
    mockFetch.mockResolvedValueOnce(mockCredits)
    const { result } = renderHook(() => useMovieCredits(42), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.cast).toHaveLength(2))
    expect(result.current.crew).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith(42, 'en')
  })

  it('returns empty arrays on failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useMovieCredits(42), { wrapper: createWrapper() })
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(result.current.cast).toEqual([])
    expect(result.current.crew).toEqual([])
  })
})
