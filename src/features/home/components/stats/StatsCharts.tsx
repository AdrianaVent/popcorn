'use client'

import {
  AreaChart, Area,
  BarChart as RBarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ChartEntry } from './statsCard.types'

type ChartProps = { data: ChartEntry[]; label: string; barColor: string; mutedColor: string }

export function MiniAreaChart({ data, label, barColor, mutedColor }: ChartProps) {
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

export function MiniBarChart({ data, label, barColor, mutedColor }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={90}>
      <RBarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: mutedColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: mutedColor }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
          contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
          itemStyle={{ color: mutedColor }}
          formatter={(v) => [v, label]}
        />
        <Bar dataKey="count" fill={barColor} radius={[3, 3, 0, 0]} maxBarSize={24} />
      </RBarChart>
    </ResponsiveContainer>
  )
}
