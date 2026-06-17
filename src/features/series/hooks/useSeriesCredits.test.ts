import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSeriesCredits } from './useSeriesCredits'
import { fetchSeriesCredits } from '@/features/series/series.service'
import type { TMDBCredits } from '@/types/tmdb'

jest.mock('@/features/series/series.service', () => ({
  fetchSeriesCredits: jest.fn(),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'es' }),
}))

const mockFetch = fetchSeriesCredits as jest.MockedFunction<typeof fetchSeriesCredits>

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
    { id: 1, name: 'Lead Actor', character: 'Protagonist', profile_path: '/lead.jpg', order: 0 },
  ],
  crew: [],
}

describe('useSeriesCredits', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty arrays and does not fetch when id is null', () => {
    const { result } = renderHook(() => useSeriesCredits(null), { wrapper: createWrapper() })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current).toEqual({ cast: [], crew: [] })
  })

  it('returns cast and crew on success', async () => {
    mockFetch.mockResolvedValueOnce(mockCredits)
    const { result } = renderHook(() => useSeriesCredits(77), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.cast).toHaveLength(1))
    expect(result.current.crew).toHaveLength(0)
    expect(mockFetch).toHaveBeenCalledWith(77, 'es')
  })

  it('returns empty arrays on failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useSeriesCredits(77), { wrapper: createWrapper() })
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(result.current.cast).toEqual([])
    expect(result.current.crew).toEqual([])
  })
})
