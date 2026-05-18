'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Text from '@/components/ui/Text'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import type { GenreEntry } from '@/features/home/hooks/useMovieGenres'

type Props = {
  title: string
  orientation: 'horizontal' | 'vertical'
  tooltipLabel: string
  userQuery: { data?: GenreEntry[]; isLoading: boolean; isError: boolean }
  globalQuery: { data?: GenreEntry[]; isLoading: boolean; isError: boolean }
  defaultMode?: 'user' | 'global'
  showUserToggle?: boolean
  className?: string
}

const CARD_BG = 'var(--color-card)'
const BORDER_COLOR = 'var(--color-border)'

type TickProps = { x: string | number; y: string | number; payload: { value: string } }

function ChartSkeleton({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
  const bars = Array.from({ length: 6 })
  return (
    <div className="flex h-75 items-end gap-2 px-2 pt-4">
      {orientation === 'vertical'
        ? bars.map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full animate-pulse rounded-sm bg-border" style={{ height: `${30 + i * 20}px` }} />
              <div className="h-2 w-10 animate-pulse rounded bg-border" />
            </div>
          ))
        : bars.map((_, i) => (
            <div key={i} className="flex w-full items-center gap-2">
              <div className="h-2 w-16 animate-pulse rounded bg-border" />
              <div className="h-5 animate-pulse rounded-sm bg-border" style={{ width: `${40 + i * 25}px` }} />
            </div>
          ))}
    </div>
  )
}

type GenreTip = { label: string; x: number; y: number }

export default function BarChart({ title, orientation, tooltipLabel, userQuery, globalQuery, defaultMode = 'user', showUserToggle = true, className = '' }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'user' | 'global'>(showUserToggle ? defaultMode : 'global')
  const [genreTip, setGenreTip] = useState<GenreTip | null>(null)
  const [isDark, setIsDark] = useState(false)

  useLayoutEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const barColor  = isDark ? '#F5E6C8' : '#8E3B2E'
  const axisColor = isDark ? '#9CA3AF' : '#111827'
  const mutedColor = isDark ? '#D1D5DB' : '#4B5563'

  const effectiveMode = mode

  // Horizontal chart: genre names on Y axis (left), truncate + hover
  const TruncatedYTick = useCallback(({ x, y, payload }: TickProps) => {
    const value = payload.value
    const isTruncated = value.length > 14
    const display = isTruncated ? value.slice(0, 14) + '…' : value
    return (
      <g
        transform={`translate(${x},${y})`}
        onMouseEnter={isTruncated ? (e) => setGenreTip({ label: value, x: e.clientX, y: e.clientY }) : undefined}
        onMouseLeave={isTruncated ? () => setGenreTip(null) : undefined}
        style={{ cursor: 'default' }}
      >
        <text textAnchor="end" fill={axisColor} fontSize={12} dy="0.355em">
          {display}
        </text>
      </g>
    )
  }, [axisColor])

  // Vertical chart: genre names on X axis (bottom, rotated), truncate + hover
  const TruncatedXTick = useCallback(({ x, y, payload }: TickProps) => {
    const value = payload.value
    const isTruncated = value.length > 15
    const display = isTruncated ? value.slice(0, 15) + '…' : value
    return (
      <g
        transform={`translate(${x},${y})`}
        onMouseEnter={isTruncated ? (e) => setGenreTip({ label: value, x: e.clientX, y: e.clientY }) : undefined}
        onMouseLeave={isTruncated ? () => setGenreTip(null) : undefined}
        style={{ cursor: 'default' }}
      >
        <text textAnchor="end" fill={axisColor} fontSize={11} transform="rotate(-35)" dy={4}>
          {display}
        </text>
      </g>
    )
  }, [axisColor])

  const query = effectiveMode === 'user' ? userQuery : globalQuery
  const data = query.data ?? []
  const isEmpty = !query.isLoading && !query.isError && data.length === 0

  const maxCount = data.reduce((max, d) => Math.max(max, d.count), 0)
  const xTicks = Array.from({ length: Math.ceil(maxCount / 10) + 1 }, (_, i) => i * 10)

  const HORIZONTAL_ROWS = 10
  const chartData = orientation === 'horizontal'
    ? [...data, ...Array(Math.max(0, HORIZONTAL_ROWS - data.length)).fill({ name: '', count: 0 })]
    : data

  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-3 select-none [&_svg]:outline-none [&_svg_*]:outline-none${className ? ` ${className}` : ''}`}>
      {genreTip && (
        <div
          style={{ position: 'fixed', left: genreTip.x + 12, top: genreTip.y - 8, zIndex: 50, pointerEvents: 'none' }}
          className="px-2 py-1 rounded-md bg-card border border-border text-[11px] text-foreground shadow-md"
        >
          {genreTip.label}
        </div>
      )}
        <div className="flex items-center justify-between gap-3">
          <Text variant="body" className="font-semibold text-foreground">{title}</Text>
          {showUserToggle && (
            <ToggleSwitch
              options={[
                { value: 'user', label: t('dashboard.mode.user') },
                { value: 'global', label: t('dashboard.mode.global') },
              ]}
              value={effectiveMode}
              onChange={setMode}
            />
          )}
        </div>

        {query.isLoading && <ChartSkeleton orientation={orientation} />}

        {query.isError && (
          <div className="flex flex-1 items-center justify-center">
            <Text variant="small" className="text-muted-foreground">{t('dashboard.chart.error')}</Text>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-1 items-center justify-center">
            <Text variant="small" className="text-muted-foreground">
              {mode === 'user' ? t('dashboard.chart.noWatched') : t('dashboard.chart.error')}
            </Text>
          </div>
        )}

        {!query.isLoading && !query.isError && data.length > 0 && (
          <div key={effectiveMode} className="flex-1 overflow-y-auto min-h-0">
          <ResponsiveContainer
            width="100%"
            height={orientation === 'horizontal' ? HORIZONTAL_ROWS * 34 + 48 : 300}
          >
              {orientation === 'horizontal' ? (
                <RechartsBarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <XAxis
                    type="number"
                    ticks={xTicks}
                    tick={{ fontSize: 11, fill: mutedColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={TruncatedYTick}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                    contentStyle={{ background: CARD_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
                    itemStyle={{ color: mutedColor }}
                    formatter={(value) => [value, tooltipLabel]}
                  />
                  <Bar dataKey="count" fill={barColor} radius={[0, 4, 4, 0]} activeBar={{ fill: barColor }} />
                </RechartsBarChart>
              ) : (
                <RechartsBarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 48 }}>
                  <XAxis
                    dataKey="name"
                    tick={TruncatedXTick}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: mutedColor }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                    contentStyle={{ background: CARD_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
                    itemStyle={{ color: mutedColor }}
                    formatter={(value) => [value, tooltipLabel]}
                  />
                  <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={32} activeBar={{ fill: barColor }} />
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
    </div>
  )
}
