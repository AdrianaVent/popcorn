import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSeriesDetail } from './useSeriesDetail'
import { fetchSeriesDetail } from '@/features/series/series.service'
import type { TMDBSeriesDetail } from '@/types/tmdb'

jest.mock('@/features/series/series.service', () => ({
  fetchSeriesDetail: jest.fn(),
  fetchSeasonDetail: jest.fn(),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const mockFetch = fetchSeriesDetail as jest.MockedFunction<typeof fetchSeriesDetail>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

const detail: Partial<TMDBSeriesDetail> = {
  id: 1396,
  name: 'Breaking Bad',
  overview: 'A high school chemistry teacher...',
  first_air_date: '2008-01-20',
  vote_average: 8.9,
  vote_count: 12000,
  status: 'Ended',
  number_of_seasons: 5,
  number_of_episodes: 62,
  episode_run_time: [45],
  seasons: [],
}

describe('useSeriesDetail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty state and does not fetch when id is null', () => {
    const { result } = renderHook(() => useSeriesDetail(null), { wrapper: createWrapper() })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current).toEqual({ detail: null, loading: false, error: null, totalRuntime: null })
  })

  it('starts loading when a valid id is provided', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useSeriesDetail(1396), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('returns detail data on success', async () => {
    mockFetch.mockResolvedValueOnce(detail as TMDBSeriesDetail)
    const { result } = renderHook(() => useSeriesDetail(1396), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.detail).toEqual(detail))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(1396, 'en')
  })

  it('sets error on failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useSeriesDetail(1396), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error).toBe('TMDB_FETCH_ERROR'))
    expect(result.current.detail).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('refetches when id changes', async () => {
    mockFetch
      .mockResolvedValueOnce({ ...detail, id: 1 } as TMDBSeriesDetail)
      .mockResolvedValueOnce({ ...detail, id: 2, name: 'Breaking Bad S2' } as TMDBSeriesDetail)

    let id = 1
    const { result, rerender } = renderHook(() => useSeriesDetail(id), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.detail?.id).toBe(1))

    id = 2
    rerender()
    await waitFor(() => expect(result.current.detail?.name).toBe('Breaking Bad S2'))
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
