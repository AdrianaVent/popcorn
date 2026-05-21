'use client'

import { useTranslation } from 'react-i18next'
import { getStatusConfig } from '../getSeriesUI'

type Props = {
  status: string | undefined  // undefined = still loading
}

export default function StatusBadge({ status }: Props) {
  const { t } = useTranslation()
  if (status === undefined) {
    return <span className="inline-block h-5 w-16 rounded bg-muted animate-pulse" />
  }
  const cfg = getStatusConfig(status)
  if (!cfg) return <span className="text-muted-foreground">—</span>
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium whitespace-nowrap ${cfg.border} ${cfg.bg} ${cfg.text}`}>
      {t(cfg.labelKey)}
    </span>
  )
}
