'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import { getTMDBImageUrl } from '@/utils/tmdb'
import type { PaidProvider } from '@/hooks/useWatchProviders'
import type { WatchProvider } from '@/types/tmdb'

type Props = {
  flatrate: WatchProvider[]
  rent: PaidProvider[]
  inTheaters?: boolean
  loading?: boolean
}

function PaidBadge({ source }: { source: 'rent' | 'buy' }) {
  return (
    <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground leading-none shadow-sm">
      {source === 'rent' ? (
        <span className="text-[9px] font-bold">€</span>
      ) : (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      )}
    </span>
  )
}

function ProviderLogo({ provider, paidSource, t }: { provider: WatchProvider; paidSource: 'rent' | 'buy' | null; t: (k: string) => string }) {
  const logo = getTMDBImageUrl(provider.logo_path, 'w92')
  if (!logo) return null

  const label = paidSource
    ? `${provider.provider_name} (${t(paidSource === 'rent' ? 'common.rent' : 'common.buy')})`
    : provider.provider_name

  return (
    <div className="relative group">
      <Image
        src={logo}
        alt={provider.provider_name}
        width={32}
        height={32}
        className="rounded-md object-cover"
      />
      {paidSource && <PaidBadge source={paidSource} />}
      <span className="pointer-events-none absolute top-full left-0 mt-1.5 px-2 py-0.5 rounded bg-popover border border-border text-foreground text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {label}
      </span>
    </div>
  )
}

export default function WatchProviders({ flatrate, rent, inTheaters, loading }: Props) {
  const { t } = useTranslation()

  const hasProviders = flatrate.length > 0 || rent.length > 0
  if (!loading && !hasProviders && !inTheaters) return null

  return (
    <div className="flex flex-col gap-2 pt-5 border-t border-border">
      <div className="flex items-center gap-3">
        <Text className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('common.availableOn')}
        </Text>
        {inTheaters && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-primary/30 hc:border-primary bg-primary/10 hc:bg-primary text-[11px] font-medium text-primary hc:text-primary-foreground whitespace-nowrap">
            <span aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <path d="M17 2l5 5-5 5" /><path d="M7 2L2 7l5 5" />
                <line x1="12" y1="12" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </span>
            {t('common.inTheaters')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="w-8 h-8 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : hasProviders ? (
        <div className="flex flex-wrap gap-3">
          {flatrate.map((p) => (
            <ProviderLogo key={p.provider_id} provider={p} paidSource={null} t={t} />
          ))}
          {rent.map((p) => (
            <ProviderLogo key={p.provider_id} provider={p} paidSource={p.source} t={t} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
