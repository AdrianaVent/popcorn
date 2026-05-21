'use client'

import { useLayoutEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, ResponsiveContainer } from 'recharts'
import Text from '@/components/ui/Text'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ContentTabToggle, { type ContentTab } from '@/components/ui/ContentTabToggle'
import type { LucideIcon } from 'lucide-react'
import type { GenreEntry } from '@/features/home/hooks/useMovieGenres'


// Interleaved order: each adjacent pair is ~180° apart on the hue wheel
// to maximise contrast between neighbouring slices in the donut
const COLORS_LIGHT = [
  '#DC2626', // red       0°
  '#1D4ED8', // blue    225°
  '#EA580C', // orange   25°
  '#CA8A04', // gold     43°
  '#15803D', // green   142°
  '#BE185D', // pink    331°
  '#7C3AED', // violet  263°
  '#0891B2', // cyan    197°
  '#65A30D', // lime     87° (brighter/more yellow than green)
  '#A21CAF', // fuchsia 296° (fills violet–pink gap, replaces brown)
]
const COLORS_DARK = [
  '#FCA5A5', // coral     0°
  '#93C5FD', // blue    217°
  '#FDBA74', // orange   28°
  '#C4B5FD', // violet  260°
  '#FDE68A', // gold     43°
  '#86EFAC', // green   150°
  '#D4B896', // tan     (muted, distinct by saturation)
  '#E879F9', // fuchsia 292°
  '#67E8F9', // cyan    190°
  '#BEF264', // lime     80°
]

type Props = {
  title: string
  tooltipLabel: string
  tab: ContentTab
  onTabChange: (tab: ContentTab) => void
  userQuery: { data?: GenreEntry[]; isLoading: boolean; isError: boolean }
  globalQuery: { data?: GenreEntry[]; isLoading: boolean; isError: boolean }
  defaultMode?: 'user' | 'global'
  showUserToggle?: boolean
  getRowIcon?: (name: string) => LucideIcon | null
  className?: string
}

function DonutSkeleton() {
  return (
    <div className="flex flex-1 items-center gap-3 min-h-0">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full animate-pulse bg-border" />
      </div>
      <div className="flex flex-col gap-2 py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5 px-1.5 py-1">
            <div className="w-2 h-2 rounded-full animate-pulse bg-border shrink-0" />
            <div className="w-3.5 h-3.5 rounded animate-pulse bg-border shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DonutChart({
  title,
  tooltipLabel,
  tab,
  onTabChange,
  userQuery,
  globalQuery,
  defaultMode = 'user',
  showUserToggle = true,
  getRowIcon,
  className = '',
}: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'user' | 'global'>(showUserToggle ? defaultMode : 'global')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [chartPx, setChartPx] = useState(0)
  const obsRef = useRef<ResizeObserver | null>(null)

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    obsRef.current?.disconnect()
    if (!el) return
    obsRef.current = new ResizeObserver((entries) => {
      const { width = 0, height = 0 } = entries[0]?.contentRect ?? {}
      const size = Math.floor(Math.min(width, height))
      if (size > 0) setChartPx(size)
    })
    obsRef.current.observe(el)
  }, [])

  useLayoutEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const colors = isDark ? COLORS_DARK : COLORS_LIGHT

  const query = mode === 'user' ? userQuery : globalQuery
  const data = query.data ?? []
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const isEmpty = !query.isLoading && !query.isError && data.length === 0

  const active = activeIndex !== null ? data[activeIndex] : null
  const activePct = active && total > 0
    ? Math.round((active.count / total) * 100)
    : null

  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-2 select-none [&_svg]:outline-none [&_svg_*]:outline-none${className ? ` ${className}` : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Text variant="body" className="font-semibold text-foreground">{title}</Text>
          <ContentTabToggle tab={tab} onTabChange={onTabChange} />
        </div>
        {showUserToggle && (
          <ToggleSwitch
            options={[
              { value: 'user',   label: t('dashboard.mode.user') },
              { value: 'global', label: t('dashboard.mode.global') },
            ]}
            value={mode}
            onChange={setMode}
          />
        )}
      </div>

      {query.isLoading && <DonutSkeleton />}

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
        <div key={mode} className="flex flex-1 items-stretch gap-2 min-h-0">
          {/* Donut — square; ResizeObserver measures the flex cell, chart gets exact pixels */}
          <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            <div className="relative" style={{ width: chartPx, height: chartPx }}>
              {chartPx > 0 && <ResponsiveContainer width={chartPx} height={chartPx}>
                <PieChart>
                  <Pie
                    data={data.map((d, i) => ({
                      ...d,
                      fill: colors[i % colors.length],
                      fillOpacity: activeIndex === null || activeIndex === i ? 1 : 0.2,
                    }))}
                    dataKey="count"
                    nameKey="name"
                    innerRadius="50%"
                    outerRadius="88%"
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    style={{ cursor: 'default', outline: 'none' }}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  />
                </PieChart>
              </ResponsiveContainer>}

              {/* Center label — only on hover */}
              {active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
                    {activePct}%
                  </span>
                  <span className="text-xs font-medium text-foreground text-center leading-tight px-4 truncate max-w-full">
                    {active.name}
                  </span>
                  <span className="text-xs text-muted-foreground text-center leading-tight capitalize">
                    {tooltipLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Legend — fixed width so the donut always dominates */}
          <div className={`grid gap-0 overflow-y-auto items-start shrink-0 w-45 ${data.length >= 6 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {data.map((entry, i) => {
              const Icon = getRowIcon?.(entry.name) ?? null
              const color = colors[i % colors.length]
              const isActive = activeIndex === i
              return (
                <button
                  key={entry.name}
                  type="button"
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-default text-left min-w-0 ${isActive ? 'bg-muted/60' : 'hover:bg-muted/40'}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  {Icon && <Icon size={12} color={color} className="shrink-0" />}
                  <span className="truncate" style={{ color }}>{entry.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
