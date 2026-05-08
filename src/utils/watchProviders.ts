import type { WatchProvider } from '@/types/tmdb'

// Removes variants of the same service (e.g. "Netflix basic with Ads" when "Netflix" is already present).
// Input must be sorted by display_priority ascending so the canonical name is processed first.
export function deduplicateProviders<T extends WatchProvider>(providers: T[]): T[] {
  const kept: T[] = []
  for (const p of providers) {
    const name = p.provider_name.toLowerCase()
    const isVariant = kept.some((k) => name.startsWith(k.provider_name.toLowerCase() + ' '))
    if (!isVariant) kept.push(p)
  }
  return kept
}

type ProviderOptionsSource = {
  watchProviderOptions: (region: string) => Promise<{ results: WatchProvider[] }>
}

export async function fetchWatchProviderOptions(
  service: ProviderOptionsSource,
  region: string,
): Promise<WatchProvider[]> {
  const r = await service.watchProviderOptions(region)
  return deduplicateProviders(r.results.sort((a, b) => a.display_priority - b.display_priority)).slice(0, 10)
}
