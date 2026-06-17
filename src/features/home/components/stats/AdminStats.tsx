'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import Text from '@/components/ui/Text'
import { useLanguageStore } from '@/store/languageStore'
import { apiFetch } from '@/services/apiFetch'
import StatChip from './StatChip'
import ChartFooter from './ChartFooter'
import { getLast6MonthBuckets, getLast6Buckets } from './statsCard.utils'
import type { Period, UserStats, ChartEntry } from './statsCard.types'

type Props = { barColor: string; mutedColor: string }

export default function AdminStats({ barColor, mutedColor }: Props) {
  const { t }        = useTranslation()
  const { language } = useLanguageStore()
  const locale       = language === 'es' ? 'es-ES' : 'en-US'
  const [period, setPeriod] = useState<Period>('monthly')

  const { data, isLoading, isError } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn:  () => apiFetch('/api/users/stats').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const chartData = useMemo<ChartEntry[]>(() => {
    if (!data) return []
    if (period === 'monthly')
      return getLast6MonthBuckets(locale).map(({ key, name }) => ({
        name, count: data.byMonth.find((b) => b.month === key)?.count ?? 0,
      }))
    const buckets = getLast6Buckets(period, locale)
    const source  = period === 'weekly' ? data.byWeek : data.byDay
    return buckets.map(({ name, start }) => ({ name, count: source?.find((b) => b.start === start)?.count ?? 0 }))
  }, [data, period, locale])

  if (isLoading) return (
    <div className="flex-1 flex flex-col gap-3 animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex-1 h-14 rounded-lg bg-border" />)}
      </div>
      <div className="flex-1 rounded-lg bg-border" />
    </div>
  )

  if (isError || !data) return (
    <div className="flex-1 flex items-center justify-center">
      <Text variant="small" className="text-muted-foreground">{t('dashboard.chart.error')}</Text>
    </div>
  )

  return (
    <>
      <div className="flex gap-1.5">
        <StatChip label={t('dashboard.stats.totalUsers')}   value={data.total} />
        <StatChip label={t('dashboard.stats.guests')}       value={data.guests} />
        <StatChip label={t('dashboard.stats.admins')}       value={data.admins} />
        <StatChip label={t('dashboard.stats.newThisMonth')} value={data.thisMonth} />
      </div>
      <ChartFooter
        chartLabel={t('dashboard.stats.registrationsChart')} itemLabel={t('users.title')}
        data={chartData} period={period} onPeriodChange={setPeriod}
        emptyMsg={t('dashboard.stats.noUsers')} hasData={data.total > 0}
        barColor={barColor} mutedColor={mutedColor}
      />
    </>
  )
}
