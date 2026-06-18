import { deduplicateProviders, fetchWatchProviderOptions } from './watchProviders'
import type { WatchProvider } from '@/types/tmdb'

type Tagged = WatchProvider & { source: 'rent' | 'buy' }

function provider(id: number, name: string, priority: number): WatchProvider {
  return { provider_id: id, provider_name: name, logo_path: '', display_priority: priority }
}

function tagged(id: number, name: string, priority: number, source: 'rent' | 'buy'): Tagged {
  return { provider_id: id, provider_name: name, logo_path: '', display_priority: priority, source }
}

describe('deduplicateProviders', () => {
  it('returns empty array unchanged', () => {
    expect(deduplicateProviders([])).toEqual([])
  })

  it('keeps all providers when no variants exist', () => {
    const providers = [
      provider(8, 'Netflix', 1),
      provider(119, 'Amazon Prime Video', 2),
      provider(384, 'HBO Max', 3),
    ]
    expect(deduplicateProviders(providers)).toHaveLength(3)
  })

  it('removes a variant that starts with the canonical name + space', () => {
    const providers = [
      provider(8, 'Netflix', 1),
      provider(1796, 'Netflix basic with Ads', 2),
    ]
    const result = deduplicateProviders(providers)
    expect(result).toHaveLength(1)
    expect(result[0].provider_name).toBe('Netflix')
  })

  it('keeps the first entry and removes all subsequent variants', () => {
    const providers = [
      provider(8, 'Netflix', 1),
      provider(1796, 'Netflix basic with Ads', 2),
      provider(1900, 'Netflix Standard', 3),
    ]
    const result = deduplicateProviders(providers)
    expect(result).toHaveLength(1)
    expect(result[0].provider_id).toBe(8)
  })

  it('does not remove Amazon Prime Video when Amazon Video is present', () => {
    const providers = [
      provider(119, 'Amazon Prime Video', 1),
      provider(10, 'Amazon Video', 2),
    ]
    const result = deduplicateProviders(providers)
    expect(result).toHaveLength(2)
  })

  it('preserves extra fields on subtype entries', () => {
    const providers = [
      tagged(8, 'Netflix', 1, 'rent'),
      tagged(1796, 'Netflix basic with Ads', 2, 'buy'),
    ]
    const result = deduplicateProviders(providers)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('rent')
  })

  it('requires input to be sorted by priority — later entries are considered variants', () => {
    // "Netflix basic with Ads" comes first (lower priority number), so "Netflix" would NOT be removed
    const providers = [
      provider(1796, 'Netflix basic with Ads', 1),
      provider(8, 'Netflix', 2),
    ]
    const result = deduplicateProviders(providers)
    // "netflix" does not start with "netflix basic with ads " → both kept
    expect(result).toHaveLength(2)
  })
})

describe('fetchWatchProviderOptions', () => {
  function makeProvider(id: number, name: string, priority: number): WatchProvider {
    return { provider_id: id, provider_name: name, logo_path: '/logo.png', display_priority: priority }
  }

  it('returns providers sorted by display_priority ascending', async () => {
    const service = {
      watchProviderOptions: jest.fn().mockResolvedValue({
        results: [
          makeProvider(3, 'Hulu', 3),
          makeProvider(1, 'Netflix', 1),
          makeProvider(2, 'Amazon', 2),
        ],
      }),
    }
    const result = await fetchWatchProviderOptions(service, 'ES')
    expect(result.map((p) => p.provider_id)).toEqual([1, 2, 3])
  })

  it('deduplicates variants after sorting', async () => {
    const service = {
      watchProviderOptions: jest.fn().mockResolvedValue({
        results: [
          makeProvider(8, 'Netflix', 1),
          makeProvider(1796, 'Netflix basic with Ads', 2),
          makeProvider(119, 'Amazon Prime Video', 3),
        ],
      }),
    }
    const result = await fetchWatchProviderOptions(service, 'ES')
    expect(result.map((p) => p.provider_name)).toEqual(['Netflix', 'Amazon Prime Video'])
  })

  it('slices result to at most 10 providers', async () => {
    const service = {
      watchProviderOptions: jest.fn().mockResolvedValue({
        results: Array.from({ length: 15 }, (_, i) => makeProvider(i + 1, `Provider${i + 1}`, i + 1)),
      }),
    }
    const result = await fetchWatchProviderOptions(service, 'ES')
    expect(result).toHaveLength(10)
  })

  it('passes the region argument to the service', async () => {
    const watchProviderOptions = jest.fn().mockResolvedValue({ results: [] })
    await fetchWatchProviderOptions({ watchProviderOptions }, 'US')
    expect(watchProviderOptions).toHaveBeenCalledWith('US')
  })

  it('returns empty array when service returns no results', async () => {
    const service = {
      watchProviderOptions: jest.fn().mockResolvedValue({ results: [] }),
    }
    const result = await fetchWatchProviderOptions(service, 'ES')
    expect(result).toEqual([])
  })
})
