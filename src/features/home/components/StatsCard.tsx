'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Text from '@/components/ui/Text'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useLanguageStore } from '@/store/languageStore'
import { apiFetch } from '@/services/apiFetch'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import { TMDB_LANGUAGE } from '@/config/tmdb'

type ChartEntry = { name: string; count: number }
type Period     = 'daily' | 'weekly' | 'monthly'
type UserStats  = {
  total: number; guests: number; admins: number; thisMonth: number
  byMonth: { month: string; count: number }[]
  byWeek:  { start: number; count: number }[]
  byDay:   { start: number; count: number }[]
}

const DAY_MS  = 86_400_000
const WEEK_MS = 7 * DAY_MS

function getLast6MonthBuckets(locale: string) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      name:  d.toLocaleDateString(locale, { month: 'short' }),
      start: d.getTime(),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
    }
  })
}

function getLast6Buckets(unitMs: number, locale: string) {
  const t0 = new Date(); t0.setDate(t0.getDate() + 1); t0.setHours(0, 0, 0, 0)
  const base = t0.getTime()
  return Array.from({ length: 6 }, (_, i) => {
    const end = base - (5 - i) * unitMs; const start = end - unitMs
    return { name: new Date(start).toLocaleDateString(locale, { day: 'numeric', month: 'short' }), start, end }
  })
}

function StatChip({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-primary/8 hc:bg-muted hc:border hc:border-border flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <span className="text-xl font-bold text-primary hc:text-foreground tabular-nums leading-none">{value}</span>
        {suffix && <span className="text-sm text-primary hc:text-foreground leading-none">{suffix}</span>}
      </div>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground text-center leading-tight mt-0.5">{label}</span>
    </div>
  )
}

function MiniAreaChart({ data, label, barColor, mutedColor }: { data: ChartEntry[]; label: string; barColor: string; mutedColor: string }) {
  return (
    <ResponsiveContainer width="100%" height={110}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={barColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={barColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: mutedColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: mutedColor }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: 'var(--color-muted)', strokeWidth: 1 }}
          contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
          itemStyle={{ color: mutedColor }}
          formatter={(v) => [v, label]}
        />
        <Area dataKey="count" stroke={barColor} strokeWidth={2} fill="url(#areaFill)" dot={{ r: 3, fill: barColor, strokeWidth: 0 }} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

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

type ChartFooterProps = {
  chartLabel: string; itemLabel: string; data: ChartEntry[]
  period: Period; onPeriodChange: (p: Period) => void
  emptyMsg: string; hasData: boolean; barColor: string; mutedColor: string
}

function ChartFooter({ chartLabel, itemLabel, data, period, onPeriodChange, emptyMsg, hasData, barColor, mutedColor }: ChartFooterProps) {
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

function GuestStats({ barColor, mutedColor }: { barColor: string; mutedColor: string }) {
  const { t }        = useTranslation()
  const userId       = useUserStore((s) => s.userId) ?? ''
  const { language } = useLanguageStore()
  const locale       = language === 'es' ? 'es-ES' : 'en-US'
  const [period, setPeriod] = useState<Period>('weekly')

  const watchedMovies   = useWatchedStore((s) => s.movies[userId])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userId])
  const watchedSeries   = useWatchedStore((s) => s.seriesData[userId])
  const userRatings     = useRatingsStore((s) => s.ratings[userId])

  const movieList    = Object.values(watchedMovies ?? {})
  const seriesList   = Object.values(watchedSeries ?? {}).filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0)
  const episodeCount = Object.values(watchedEpisodes ?? {}).reduce((sum, eps) => sum + Object.keys(eps).length, 0)
  const allRatings   = [...Object.values(userRatings?.movies ?? {}), ...Object.values(userRatings?.series ?? {})]
  const avgRating    = allRatings.length > 0 ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1) : '—'

  const collectionIds = useMemo(() => {
    const seen = new Set<number>()
    for (const m of movieList) { if (m.collection_id) seen.add(m.collection_id) }
    return [...seen]
  }, [movieList])

  const collectionQueries = useQueries({
    queries: collectionIds.map((id) => ({
      queryKey: ['collection', id, TMDB_LANGUAGE[language] ?? 'es-ES'],
      queryFn:  () => fetchCollectionDetail(id, TMDB_LANGUAGE[language] ?? 'es-ES'),
      staleTime: 24 * 60 * 60 * 1000,
    })),
  })

  const completedSagas = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const watchedIds = new Set(movieList.map((m) => m.id))
    return collectionQueries.filter((q) => {
      if (!q.data) return false
      const released = q.data.parts.filter((p) => p.release_date && p.release_date <= today)
      return released.length > 0 && released.every((p) => watchedIds.has(p.id))
    }).length
  }, [collectionQueries, movieList])

  const buckets = period === 'monthly'
    ? getLast6MonthBuckets(locale)
    : getLast6Buckets(period === 'weekly' ? WEEK_MS : DAY_MS, locale)

  const chartData: ChartEntry[] = buckets.map(({ name, start, end }) => ({
    name,
    count: movieList.filter((m) => m.watchedAt != null && m.watchedAt >= start && m.watchedAt < end).length,
  }))

  return (
    <>
      <div className="flex gap-1.5">
        <StatChip label={t('dashboard.stats.movies')}    value={movieList.length} />
        <StatChip label={t('dashboard.stats.sagas')}     value={completedSagas} />
        <StatChip label={t('dashboard.stats.series')}    value={seriesList.length} />
        <StatChip label={t('dashboard.stats.episodes')}  value={episodeCount} />
        <StatChip label={t('dashboard.stats.avgRating')} value={avgRating} suffix={allRatings.length > 0 ? '★' : undefined} />
      </div>
      <ChartFooter
        chartLabel={t('dashboard.stats.activityChart')} itemLabel={t('dashboard.stats.titles')}
        data={chartData} period={period} onPeriodChange={setPeriod}
        emptyMsg={t('dashboard.stats.noActivity')} hasData={movieList.length > 0 || seriesList.length > 0}
        barColor={barColor} mutedColor={mutedColor}
      />
    </>
  )
}

function AdminStats({ barColor, mutedColor }: { barColor: string; mutedColor: string }) {
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
    const buckets = getLast6Buckets(period === 'weekly' ? WEEK_MS : DAY_MS, locale)
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

export default function StatsCard({ className = '' }: { className?: string }) {
  const { t }   = useTranslation()
  const role    = useUserStore((s) => s.role)
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light')

  useLayoutEffect(() => {
    const check = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      setTheme(attr === 'dark' ? 'dark' : attr === 'high-contrast' ? 'high-contrast' : 'light')
    }
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const barColor   = theme === 'dark' ? '#F5E6C8' : theme === 'high-contrast' ? '#712F24' : '#8E3B2E'
  const mutedColor = theme === 'dark' ? '#D1D5DB' : theme === 'high-contrast' ? '#6B7280' : '#9CA3AF'

  return (
    <div data-cy="stats-card" className={`flex flex-col gap-3 rounded-xl border border-border bg-card p-3 select-none [&_svg]:outline-none [&_svg_*]:outline-none${className ? ` ${className}` : ''}`}>
      <Text variant="body" className="font-semibold text-foreground">
        {role === 'admin' ? t('dashboard.stats.titleAdmin') : t('dashboard.stats.titleGuest')}
      </Text>
      {role === 'admin'
        ? <AdminStats barColor={barColor} mutedColor={mutedColor} />
        : <GuestStats barColor={barColor} mutedColor={mutedColor} />
      }
    </div>
  )
}
