'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '@/components/icons'
import ContentTabToggle, { type ContentTab } from '@/components/ui/ContentTabToggle'
import Text from '@/components/ui/Text'
import CalendarReleaseItem from './CalendarReleaseItem'
import type { ReleaseEntry } from '@/services/tmdb/releases'


type Props = {
  year: number
  month: number // 1-12
  tab: ContentTab
  onTabChange: (tab: ContentTab) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  query: { data?: ReleaseEntry[]; isLoading: boolean; isError: boolean }
  genreMap?: Record<number, string>
  onEntryClick?: (id: number) => void
  animateFrom?: 'left' | 'right'
  className?: string
}

const WEEKDAY_NAMES: Record<string, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'],
}

const DEFAULT_GENRE_MAP: Record<number, string> = {}

export default function ReleaseCalendar({ year, month, tab, onTabChange, onPrevMonth, onNextMonth, onToday, query, genreMap = DEFAULT_GENRE_MAP, onEntryClick, animateFrom, className = '' }: Props) {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const locale   = language === 'en' ? 'en-US' : 'es-ES'
  const weekdays = WEEKDAY_NAMES[language] ?? WEEKDAY_NAMES.en

  const now      = new Date()
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null

  const monthName = useMemo(() => {
    const raw = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month - 1, 1))
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [year, month, locale])

  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    [locale]
  )

  const releaseDays = useMemo(() => {
    const map = new Map<number, number>()
    if (!query.data) return map
    for (const item of query.data) {
      if (!item.date) continue
      const [y, m, d] = item.date.split('-').map(Number)
      if (y === year && m === month) map.set(d, (map.get(d) ?? 0) + 1)
    }
    return map
  }, [query.data, year, month])

  const { cells, rows } = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDow    = new Date(year, month - 1, 1).getDay()
    const offset      = firstDow === 0 ? 6 : firstDow - 1
    const cs: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    while (cs.length % 7 !== 0) cs.push(null)
    return { cells: cs, rows: cs.length / 7 }
  }, [year, month])

  const selectedReleases = useMemo<ReleaseEntry[]>(() => {
    if (selectedDay === null || !query.data) return []
    const seen = new Set<number>()
    return query.data.filter((item) => {
      if (!item.date) return false
      const [y, m, d] = item.date.split('-').map(Number)
      if (!(y === year && m === month && d === selectedDay)) return false
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [selectedDay, query.data, year, month])

  const selectedDateLabel = selectedDay !== null
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(year, month - 1, selectedDay))
    : ''

  const showingReleases = selectedDay !== null

  const animClass = animateFrom === 'left' ? 'animate-slide-from-left' : animateFrom === 'right' ? 'animate-slide-from-right' : 'animate-fade-in'

  return (
    <div role="region" aria-label={t('calendar.title')} className={`flex flex-col flex-1 gap-2 rounded-xl border border-border bg-card p-3 select-none ${animClass}${className ? ` ${className}` : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Text variant="body" className="font-semibold text-foreground">
            {t('calendar.title')}
          </Text>
          <ContentTabToggle tab={tab} onTabChange={(t) => { onTabChange(t); setSelectedDay(null) }} />
        </div>

        <div className="flex items-center gap-2">

          {showingReleases ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{selectedDateLabel}</span>
              <button
                data-cy="calendar-close"
                aria-label={t('calendar.close')}
                onClick={() => setSelectedDay(null)}
                className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
              >
                <span aria-hidden="true"><XIcon size={14} /></span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              {todayDay === null && (
              <button
                onClick={onToday}
                className="text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 hc:hover:bg-muted px-1.5 py-0.5 rounded-md transition-colors mr-1 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
              >
                {t('calendar.today')}
              </button>
            )}
            <button
              aria-label={t('calendar.prevMonth')}
              onClick={onPrevMonth}
              className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <span aria-hidden="true"><ChevronLeftIcon size={14} /></span>
            </button>
            <span className="text-xs font-semibold text-foreground min-w-28 text-center">
              {monthName} {year}
            </span>
            <button
              aria-label={t('calendar.nextMonth')}
              onClick={onNextMonth}
              className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <span aria-hidden="true"><ChevronRightIcon size={14} /></span>
            </button>
            </div>
          )}
        </div>
      </div>

      {/* Content area — relative so the releases panel can overlay the calendar */}
      <div className="relative flex flex-col gap-2 flex-1 overflow-hidden">

        {/* Calendar (always mounted to preserve height; invisible when releases are shown) */}
        <div className={`flex flex-col gap-2 flex-1${showingReleases ? ' invisible' : ''}`}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7">
            {weekdays.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          {query.isLoading ? (
            <div className="grid grid-cols-7 gap-0.5 flex-1" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
              {cells.map((_, i) => (
                <div key={i} className="rounded-md bg-border animate-pulse" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="flex flex-1 items-center justify-center">
              <Text variant="small" className="text-muted-foreground">{t('calendar.error')}</Text>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5 flex-1" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={i} aria-hidden="true" className="rounded-md h-full" />
                }

                const count      = releaseDays.get(day) ?? 0
                const hasRelease = count > 0
                const isToday    = day === todayDay

                let cellClass = 'flex flex-col items-center justify-center rounded-md text-xs transition-colors h-full outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset leading-none gap-[2px]'

                if (hasRelease && isToday) {
                  cellClass += ' bg-primary/15 dark:bg-primary/35 hc:bg-primary text-primary hc:text-primary-foreground font-semibold ring-[1.5px] ring-inset ring-primary hc:hover:bg-background hc:hover:text-primary cursor-pointer'
                } else if (hasRelease) {
                  cellClass += ' bg-primary/15 dark:bg-primary/35 hc:bg-primary text-foreground hc:text-primary-foreground font-medium hover:bg-primary/25 dark:hover:bg-primary/45 hc:hover:bg-background hc:hover:text-primary hc:hover:ring-[1.5px] hc:hover:ring-inset hc:hover:ring-primary cursor-pointer'
                } else if (isToday) {
                  cellClass += ' text-primary font-semibold ring-[1.5px] ring-inset ring-primary hover:bg-muted/40 hc:hover:bg-muted'
                } else {
                  cellClass += ' text-muted-foreground hover:bg-muted/40 hc:hover:bg-muted'
                }

                const dayLabel = dayFormatter.format(new Date(year, month - 1, day))
                return (
                  <button
                    key={i}
                    disabled={!hasRelease}
                    onClick={() => hasRelease && setSelectedDay(day)}
                    aria-label={hasRelease ? `${dayLabel} (${count})` : dayLabel}
                    aria-pressed={selectedDay === day}
                    className={cellClass}
                  >
                    <span aria-hidden="true">{day}</span>
                    {hasRelease && (
                      <span aria-hidden="true" className="w-4 h-0.75 rounded-full bg-primary opacity-70 hc:opacity-100" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Releases panel — overlays the calendar, same bounding box */}
        {showingReleases && (
          <div key={selectedDay} className="absolute inset-0 overflow-y-auto animate-slide-from-bottom">
            {selectedReleases.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Text variant="small" className="text-muted-foreground text-center">{t('calendar.empty')}</Text>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {selectedReleases.map((release) => (
                  <CalendarReleaseItem
                    key={`${release.id}-${release.title}`}
                    release={release}
                    genreMap={genreMap}
                    onEntryClick={onEntryClick}
                    language={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
