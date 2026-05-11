import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMovieReleases, useSeriesReleases } from './useReleases'
import type { WatchProvider } from '@/types/tmdb'

const mockMovies = jest.fn().mockResolvedValue([])
const mockSeries = jest.fn().mockResolvedValue([])

jest.mock('@/services/tmdb/releases', () => ({
  releasesService: { movies: (...args: unknown[]) => mockMovies(...args), series: (...args: unknown[]) => mockSeries(...args) },
}))

const mockFetchWatchProviderOptions = jest.fn()
jest.mock('@/utils/watchProviders', () => ({
  fetchWatchProviderOptions: (...args: unknown[]) => mockFetchWatchProviderOptions(...args),
}))

jest.mock('@/services/tmdb', () => ({ seriesService: {} }))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: (fn: (s: { language: string; region: string }) => unknown) =>
    fn({ language: 'es', region: 'ES' }),
}))

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children)
  }
  return Wrapper
}

describe('useMovieReleases', () => {
  afterEach(() => mockMovies.mockClear())

  it('fetches movie releases with year, month, region and language', async () => {
    renderHook(() => useMovieReleases(2025, 5), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockMovies).toHaveBeenCalledWith(2025, 5, 'ES', 'es-ES'))
  })
})

describe('useSeriesReleases', () => {
  afterEach(() => {
    mockSeries.mockClear()
    mockFetchWatchProviderOptions.mockClear()
  })

  it('does not fetch series releases when providers return empty', async () => {
    mockFetchWatchProviderOptions.mockResolvedValue([])
    renderHook(() => useSeriesReleases(2025, 5), { wrapper: makeWrapper() })
    await waitFor(() => expect(mockFetchWatchProviderOptions).toHaveBeenCalled())
    expect(mockSeries).not.toHaveBeenCalled()
  })

  it('fetches series releases when providers are available', async () => {
    const providers: WatchProvider[] = [
      { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priority: 1 },
      { provider_id: 119, provider_name: 'Amazon', logo_path: '/a.png', display_priority: 2 },
    ]
    mockFetchWatchProviderOptions.mockResolvedValue(providers)
    renderHook(() => useSeriesReleases(2025, 5), { wrapper: makeWrapper() })
    await waitFor(() =>
      expect(mockSeries).toHaveBeenCalledWith(2025, 5, '8|119', 'ES', 'es-ES')
    )
  })
})
