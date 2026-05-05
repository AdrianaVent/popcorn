import { deduplicateProviders } from './watchProviders'
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
