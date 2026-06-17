import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePersonCredits } from './usePersonCredits'
import { fetchPersonCredits } from '@/features/person/person.service'
import type { TMDBPersonCombinedCredits, TMDBPersonCombinedCredit } from '@/types/tmdb'

jest.mock('@/features/person/person.service', () => ({
  fetchPersonCredits: jest.fn(),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const mockFetch = fetchPersonCredits as jest.MockedFunction<typeof fetchPersonCredits>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

const makeCredit = (id: number, media_type: 'movie' | 'tv'): TMDBPersonCombinedCredit => ({
  id,
  media_type,
  title: media_type === 'movie' ? `Movie ${id}` : undefined,
  name: media_type === 'tv' ? `Series ${id}` : undefined,
  poster_path: null,
  vote_average: 7.5,
  vote_count: 1000,
  character: 'Hero',
  genre_ids: [28],
  original_language: 'en',
})

const mockCredits: TMDBPersonCombinedCredits = {
  cast: [makeCredit(1, 'movie'), makeCredit(2, 'tv')],
  crew: [makeCredit(3, 'movie')],
}

describe('usePersonCredits', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not fetch when id is null', () => {
    const { result } = renderHook(() => usePersonCredits(null), { wrapper: createWrapper() })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.cast).toEqual([])
    expect(result.current.crew).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('starts loading when a valid id is provided', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => usePersonCredits(1), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('returns cast and crew on success', async () => {
    mockFetch.mockResolvedValueOnce(mockCredits)
    const { result } = renderHook(() => usePersonCredits(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.cast).toHaveLength(2))
    expect(result.current.crew).toHaveLength(1)
    expect(result.current.loading).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith(1, 'en')
  })

  it('returns empty arrays on failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => usePersonCredits(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cast).toEqual([])
    expect(result.current.crew).toEqual([])
  })
})
