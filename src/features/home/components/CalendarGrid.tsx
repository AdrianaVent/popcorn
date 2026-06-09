'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import { HeartIcon } from '@/components/icons'
import type { ReleaseEntry } from '@/services/tmdb/releases'

type Props = {
  query: { data?: ReleaseEntry[]; isLoading: boolean; isError: boolean }
  year: number
  month: number
  weekdays: string[]
  watchlistIds: Set<number>
  todayDay: number | null
  selectedDay: number | null
  onSelect: (day: number) => void
  locale: string
}

const DAY_CELL_BASE = 'flex flex-col items-center justify-center rounded-md text-xs transition-colors h-full outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset leading-none gap-[2px]'

function getDayCellClass(hasRelease: boolean, isToday: boolean): string {
  if (hasRelease && isToday) return `${DAY_CELL_BASE} bg-primary/15 dark:bg-primary/35 hc:bg-primary text-primary hc:text-primary-foreground font-semibold ring-[1.5px] ring-inset ring-primary hc:hover:bg-background hc:hover:text-primary cursor-pointer`
  if (hasRelease)            return `${DAY_CELL_BASE} bg-primary/15 dark:bg-primary/35 hc:bg-primary text-foreground hc:text-primary-foreground font-medium hover:bg-primary/25 dark:hover:bg-primary/45 hc:hover:bg-background hc:hover:text-primary hc:hover:ring-[1.5px] hc:hover:ring-inset hc:hover:ring-primary cursor-pointer`
  if (isToday)               return `${DAY_CELL_BASE} text-primary font-semibold ring-[1.5px] ring-inset ring-primary hover:bg-muted/40 hc:hover:bg-muted`
  return `${DAY_CELL_BASE} text-muted-foreground hover:bg-muted/40 hc:hover:bg-muted`
}

export default function CalendarGrid({ query, year, month, weekdays, watchlistIds, todayDay, selectedDay, onSelect, locale }: Props) {
  const { t } = useTranslation()

  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  )

  const { releaseDays, watchlistDays } = useMemo(() => {
    const releases  = new Map<number, number>()
    const watchlist = new Set<number>()
    for (const item of query.data ?? []) {
      if (!item.date) continue
      const [y, m, d] = item.date.split('-').map(Number)
      if (y !== year || m !== month) continue
      releases.set(d, (releases.get(d) ?? 0) + 1)
      if (watchlistIds.has(item.id)) watchlist.add(d)
    }
    return { releaseDays: releases, watchlistDays: watchlist }
  }, [query.data, watchlistIds, year, month])

  const { cells, rows } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDow    = new Date(year, month - 1, 1).getDay()
    const offset      = firstDow === 0 ? 6 : firstDow - 1
    const cs: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    while (cs.length % 7 !== 0) cs.push(null)
    return { cells: cs, rows: cs.length / 7 }
  }, [year, month])

  const gridStyle = { gridTemplateRows: `repeat(${rows}, 1fr)` }

  return (
    <>
      <div className="grid grid-cols-7">
        {weekdays.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-7 gap-0.5 flex-1" style={gridStyle}>
          {cells.map((_, i) => <div key={i} className="rounded-md bg-border animate-pulse" />)}
        </div>
      ) : query.isError ? (
        <div className="flex flex-1 items-center justify-center">
          <Text variant="small" className="text-muted-foreground">{t('calendar.error')}</Text>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5 flex-1" style={gridStyle}>
          {cells.map((day, i) => {
            if (day === null) return <div key={i} aria-hidden="true" className="rounded-md h-full" />
            const count               = releaseDays.get(day) ?? 0
            const hasRelease          = count > 0
            const isToday             = day === todayDay
            const hasWatchlistRelease = watchlistDays.has(day)
            const dayLabel            = dayFormatter.format(new Date(year, month - 1, day))
            return (
              <button
                key={i}
                disabled={!hasRelease}
                onClick={() => hasRelease && onSelect(day)}
                aria-label={hasRelease ? `${dayLabel} (${count})` : dayLabel}
                aria-pressed={selectedDay === day}
                className={getDayCellClass(hasRelease, isToday)}
              >
                <span aria-hidden="true">{day}</span>
                {hasRelease && (
                  <div aria-hidden="true" className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary opacity-70 hc:bg-primary-foreground hc:opacity-100 shrink-0" />
                    {hasWatchlistRelease && (
                      <span className="text-primary opacity-90 hc:text-primary-foreground hc:opacity-100 shrink-0">
                        <HeartIcon size={8} filled strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
