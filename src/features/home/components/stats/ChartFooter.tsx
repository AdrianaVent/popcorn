'use client'

import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import { MiniAreaChart } from './StatsCharts'
import type { ChartEntry, Period } from './statsCard.types'

const PERIODS: Period[] = ['daily', 'weekly', 'monthly']

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('dashboard.stats.activityChart')} className="flex gap-1">
      {PERIODS.map((p) => (
        <button key={p} onClick={() => onChange(p)} aria-pressed={value === p}
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${value === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {t(`dashboard.stats.period.${p}`)}
        </button>
      ))}
    </div>
  )
}

type Props = {
  chartLabel: string; itemLabel: string; data: ChartEntry[]
  period: Period; onPeriodChange: (p: Period) => void
  emptyMsg: string; hasData: boolean; barColor: string; mutedColor: string
}

export default function ChartFooter({ chartLabel, itemLabel, data, period, onPeriodChange, emptyMsg, hasData, barColor, mutedColor }: Props) {
  return (
    <div className="flex-1 flex flex-col justify-end min-h-0">
      {hasData ? (
        <>
          <div className="flex items-center justify-between mb-1">
            <Text variant="caption" className="text-muted-foreground">{chartLabel}</Text>
            <PeriodToggle value={period} onChange={onPeriodChange} />
          </div>
          <MiniAreaChart data={data} label={itemLabel} barColor={barColor} mutedColor={mutedColor} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Text variant="small" className="text-muted-foreground text-center">{emptyMsg}</Text>
        </div>
      )}
    </div>
  )
}
