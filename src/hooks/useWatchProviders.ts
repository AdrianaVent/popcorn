import { useAsync } from '@/hooks/useAsync'
import { deduplicateProviders } from '@/utils/watchProviders'
import { WATCH_PROVIDERS_REGION } from '@/config/constants'
import type { WatchProvider, WatchProvidersResult } from '@/types/tmdb'

export type PaidProvider = WatchProvider & { source: 'rent' | 'buy' }
export type WatchProvidersData = { flatrate: WatchProvider[]; rent: PaidProvider[]; loading: boolean }

export function useWatchProviders(
  id: number | null,
  fetcher: (id: number) => Promise<WatchProvidersResult>,
): WatchProvidersData {
  const { data, loading } = useAsync<Omit<WatchProvidersData, 'loading'>>(
    () =>
      id !== null
        ? fetcher(id).then((r) => {
            const region = r.results[WATCH_PROVIDERS_REGION]
            const flatrate = deduplicateProviders(
              (region?.flatrate ?? []).sort((a, b) => a.display_priority - b.display_priority),
            )
            const flatrateIds = new Set(flatrate.map((p) => p.provider_id))

            // Tag each provider with its source; rent takes precedence over buy
            const paidById = new Map<number, PaidProvider>()
            for (const p of (region?.rent ?? [])) {
              if (!paidById.has(p.provider_id)) paidById.set(p.provider_id, { ...p, source: 'rent' })
            }
            for (const p of (region?.buy ?? [])) {
              if (!paidById.has(p.provider_id)) paidById.set(p.provider_id, { ...p, source: 'buy' })
            }

            const rent = deduplicateProviders(
              [...paidById.values()]
                .sort((a, b) => a.display_priority - b.display_priority)
                .filter((p) => !flatrateIds.has(p.provider_id)),
            ).slice(0, 3)

            return { flatrate, rent }
          })
        : null,
    [id],
  )

  return { ...(data ?? { flatrate: [], rent: [] }), loading }
}
