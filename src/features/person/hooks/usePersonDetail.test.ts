import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePersonDetail } from './usePersonDetail'
import { fetchPersonDetail } from '@/features/person/person.service'
import type { TMDBPerson } from '@/types/tmdb'

jest.mock('@/features/person/person.service', () => ({
  fetchPersonDetail: jest.fn(),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const mockFetch = fetchPersonDetail as jest.MockedFunction<typeof fetchPersonDetail>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

const mockPerson: TMDBPerson = {
  id: 1,
  name: 'Tom Hanks',
  profile_path: '/profile.jpg',
  biography: 'An American actor.',
  birthday: '1956-07-09',
  place_of_birth: 'Concord, California',
  known_for_department: 'Acting',
}

describe('usePersonDetail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not fetch when id is null', () => {
    const { result } = renderHook(() => usePersonDetail(null), { wrapper: createWrapper() })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.person).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('starts loading when a valid id is provided', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => usePersonDetail(1), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('returns person data on success', async () => {
    mockFetch.mockResolvedValueOnce(mockPerson)
    const { result } = renderHook(() => usePersonDetail(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.person).toEqual(mockPerson))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(1, 'en')
  })

  it('sets error on failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => usePersonDetail(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error).toBe('TMDB_FETCH_ERROR'))
    expect(result.current.person).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
