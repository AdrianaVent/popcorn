import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMovieDetail } from './useMovieDetail'
import { fetchMovieDetail } from '@/features/movies/movies.service'
import type { TMDBMovieDetail } from '@/types/tmdb'

jest.mock('@/features/movies/movies.service', () => ({
  fetchMovieDetail: jest.fn(),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const mockFetch = fetchMovieDetail as jest.MockedFunction<typeof fetchMovieDetail>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

const detail: Partial<TMDBMovieDetail> = {
  id: 27205,
  title: 'Inception',
  overview: 'A thief who steals corporate secrets...',
  release_date: '2010-07-16',
  vote_average: 8.4,
  vote_count: 35000,
  poster_path: '/poster.jpg',
}

describe('useMovieDetail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty state and does not fetch when id is null', () => {
    const { result } = renderHook(() => useMovieDetail(null), { wrapper: createWrapper() })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current).toEqual({ detail: null, loading: false, error: null })
  })

  it('starts loading when a valid id is provided', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useMovieDetail(27205), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('returns detail data on success', async () => {
    mockFetch.mockResolvedValueOnce(detail as TMDBMovieDetail)
    const { result } = renderHook(() => useMovieDetail(27205), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.detail).toEqual(detail))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(27205, 'en')
  })

  it('sets error on failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useMovieDetail(27205), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error).toBe('TMDB_FETCH_ERROR'))
    expect(result.current.detail).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('refetches when id changes', async () => {
    mockFetch
      .mockResolvedValueOnce({ ...detail, id: 1 } as TMDBMovieDetail)
      .mockResolvedValueOnce({ ...detail, id: 2, title: 'The Dark Knight' } as TMDBMovieDetail)

    let id = 1
    const { result, rerender } = renderHook(() => useMovieDetail(id), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.detail?.id).toBe(1))

    id = 2
    rerender()
    await waitFor(() => expect(result.current.detail?.title).toBe('The Dark Knight'))
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
