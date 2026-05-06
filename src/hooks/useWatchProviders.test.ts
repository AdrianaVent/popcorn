import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWatchProviders } from './useWatchProviders'
import type { WatchProvider, WatchProvidersResult } from '@/types/tmdb'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

function provider(id: number, name: string, priority: number): WatchProvider {
  return { provider_id: id, provider_name: name, logo_path: '', display_priority: priority }
}

function makeResult(data: WatchProvidersResult['results']['ES']): WatchProvidersResult {
  return { results: { ES: data } }
}

describe('useWatchProviders', () => {
  it('does not fetch when id is null', () => {
    const fetcher = jest.fn()
    renderHook(() => useWatchProviders(null, fetcher, 'movie'), { wrapper: createWrapper() })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('starts loading when id is provided', () => {
    const fetcher = jest.fn(() => new Promise<WatchProvidersResult>(() => {}))
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('returns sorted flatrate providers', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({ flatrate: [provider(2, 'HBO Max', 2), provider(1, 'Netflix', 1)] }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.flatrate.map((p) => p.provider_id)).toEqual([1, 2])
  })

  it('deduplicates flatrate by name prefix', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({ flatrate: [provider(8, 'Netflix', 1), provider(1796, 'Netflix basic with Ads', 2)] }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.flatrate).toHaveLength(1)
    expect(result.current.flatrate[0].provider_name).toBe('Netflix')
  })

  it('merges rent and buy into the paid section', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({
        rent: [provider(2, 'Apple TV', 2)],
        buy: [provider(10, 'Amazon Video', 3)],
      }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rent).toHaveLength(2)
  })

  it('tags rent providers with source=rent and buy-only with source=buy', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({
        rent: [provider(2, 'Apple TV', 1)],
        buy: [provider(10, 'Amazon Video', 2)],
      }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rent.find((p) => p.provider_id === 2)?.source).toBe('rent')
    expect(result.current.rent.find((p) => p.provider_id === 10)?.source).toBe('buy')
  })

  it('prefers rent source over buy when provider appears in both', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({
        rent: [provider(10, 'Amazon Video', 1)],
        buy: [provider(10, 'Amazon Video', 1)],
      }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rent).toHaveLength(1)
    expect(result.current.rent[0].source).toBe('rent')
  })

  it('excludes from paid providers already in flatrate', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({
        flatrate: [provider(8, 'Netflix', 1)],
        rent: [provider(8, 'Netflix', 1), provider(2, 'Apple TV', 2)],
      }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rent).toHaveLength(1)
    expect(result.current.rent[0].provider_id).toBe(2)
  })

  it('limits paid providers to 3', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      makeResult({
        buy: [
          provider(1, 'A', 1), provider(2, 'B', 2), provider(3, 'C', 3), provider(4, 'D', 4),
        ],
      }),
    )
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rent).toHaveLength(3)
  })

  it('returns empty arrays when region has no data', async () => {
    const fetcher = jest.fn().mockResolvedValue({ results: {} })
    const { result } = renderHook(() => useWatchProviders(1, fetcher, 'movie'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.flatrate).toEqual([])
    expect(result.current.rent).toEqual([])
  })
})
