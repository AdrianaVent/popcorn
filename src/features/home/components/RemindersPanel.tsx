'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { localToday } from '@/utils/formatDate'
import Text from '@/components/ui/Text'
import ReminderItem from './ReminderItem'
import { useUpcomingWatchlistReleases } from '@/features/home/hooks/useUpcomingWatchlistReleases'
import type { ReleaseEntry } from '@/services/tmdb/releases'

type Props = {
  watchlistMovieIds: Set<number>
  watchlistSeriesIds: Set<number>
  onEntryClick?: (id: number) => void
  className?: string
}

export default function RemindersPanel({ watchlistMovieIds, watchlistSeriesIds, onEntryClick, className = '' }: Props) {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const locale   = language === 'en' ? 'en-US' : 'es-ES'

  const { entries, isLoading, isError } = useUpcomingWatchlistReleases(watchlistMovieIds, watchlistSeriesIds)

  const today = useMemo(() => localToday(), [])

  const todayEntries = useMemo(() => entries.filter((e) => e.date === today), [entries, today])

  const futureGroups = useMemo<[string, ReleaseEntry[]][]>(() => {
    const map = new Map<string, ReleaseEntry[]>()
    for (const entry of entries) {
      if (entry.date <= today) continue
      if (!map.has(entry.date)) map.set(entry.date, [])
      map.get(entry.date)!.push(entry)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entries, today])

  const todayDateLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(today + 'T12:00:00')),
    [locale, today]
  )

  if (isLoading) {
    return (
      <div className={`flex flex-col gap-2 p-1 overflow-hidden animate-fade-in ${className}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-14 rounded-lg bg-border animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className={`flex items-center justify-center animate-fade-in ${className}`}>
        <Text variant="small" className="text-muted-foreground">{t('calendar.error')}</Text>
      </div>
    )
  }

  return (
    <div className={`flex flex-row overflow-hidden animate-fade-in ${className}`}>

      {/* Today — 1/3 */}
      <div className="w-1/3 min-w-0 flex flex-col border-r border-border overflow-hidden">
        <div className="shrink-0 h-8 flex items-center justify-between px-2 border-b border-border">
          <span className="text-caption font-semibold uppercase tracking-[0.14em] text-primary">
            {t('calendar.today')}
          </span>
          <span className="text-caption font-semibold text-primary">{todayDateLabel}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {todayEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center px-2">
              <Text variant="small" className="text-muted-foreground text-center">{t('calendar.remindersTodayEmpty')}</Text>
            </div>
          ) : (
            <div className="flex flex-col">
              {todayEntries.map((entry) => (
                <ReminderItem key={entry.id} release={entry} onEntryClick={onEntryClick} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming — 2/3 */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="shrink-0 h-8 flex items-center px-2 border-b border-border">
          <span className="text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t('calendar.remindersUpcoming')}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {futureGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center px-2">
              <Text variant="small" className="text-muted-foreground text-center">{t('calendar.remindersEmpty')}</Text>
            </div>
          ) : (
            <div className="flex flex-col">
              {futureGroups.map(([date, items]) => (
                <div key={date}>
                  <div className="sticky top-0 z-10 bg-card px-2 py-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(date + 'T12:00:00'))}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {items.map((entry) => (
                      <ReminderItem key={entry.id} release={entry} onEntryClick={onEntryClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
