'use client'

import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import { MiniBarChart } from './StatsCharts'
import type { ChartEntry } from './statsCard.types'

type Props = {
  ratingHistogram: ChartEntry[]
  decadeData: ChartEntry[]
  avgRating: string
  hasRatings: boolean
  hasContent: boolean
  barColor: string
  mutedColor: string
}

export default function InsightsTab({ ratingHistogram, decadeData, avgRating, hasRatings, hasContent, barColor, mutedColor }: Props) {
  const { t } = useTranslation()

  if (!hasRatings && !hasContent) {
    return (
      <div data-cy="stats-no-insights" className="flex-1 flex items-center justify-center">
        <Text variant="small" className="text-muted-foreground text-center">{t('dashboard.stats.noInsights')}</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {hasRatings && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Text variant="caption" className="text-muted-foreground">{t('dashboard.stats.ratingsChart')}</Text>
            <span className="text-sm font-bold text-primary hc:text-foreground tabular-nums">{avgRating}★</span>
          </div>
          <MiniBarChart data={ratingHistogram} label={t('dashboard.stats.titles')} barColor={barColor} mutedColor={mutedColor} />
        </div>
      )}
      {hasContent && decadeData.length > 0 && (
        <div>
          <Text variant="caption" className="text-muted-foreground block mb-1">{t('dashboard.stats.decadesChart')}</Text>
          <MiniBarChart data={decadeData} label={t('dashboard.stats.titles')} barColor={barColor} mutedColor={mutedColor} />
        </div>
      )}
    </div>
  )
}
