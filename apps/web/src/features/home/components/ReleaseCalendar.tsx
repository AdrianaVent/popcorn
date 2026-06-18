'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { ChevronLeftIcon, ChevronRightIcon, XIcon, BookmarkIcon, StarIcon } from '@/components/icons'
import ContentTabToggle, { type ContentTab } from '@/components/ui/ContentTabToggle'
import IconToggleButton from '@/components/ui/IconToggleButton'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import CalendarGrid from './CalendarGrid'
import CalendarReleaseItem from './CalendarReleaseItem'
import RemindersPanel from './RemindersPanel'
import SeasonalPanel from './SeasonalPanel'
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
  watchlistMovieIds?: Set<number>
  watchlistSeriesIds?: Set<number>
  onEntryClick?: (id: number) => void
  onSeriesEntryClick?: (id: number) => void
  animateFrom?: 'left' | 'right'
  className?: string
}

const WEEKDAY_NAMES: Record<string, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'],
}

const DEFAULT_GENRE_MAP: Record<number, string> = {}
const EMPTY_SET = new Set<number>()

const ICON_BTN_CLS = 'flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset'

function CloseBar({ label, closeLabel, onClose, dataCy }: {
  label: string; closeLabel: string; onClose: () => void; dataCy?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <button data-cy={dataCy} aria-label={closeLabel} onClick={onClose} className={ICON_BTN_CLS}>
        <span aria-hidden="true"><XIcon size={14} /></span>
      </button>
    </div>
  )
}

export default function ReleaseCalendar({ year, month, tab, onTabChange, onPrevMonth, onNextMonth, onToday, query, genreMap = DEFAULT_GENRE_MAP, watchlistMovieIds, watchlistSeriesIds, onEntryClick, onSeriesEntryClick, animateFrom, className }: Props) {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const role = useUserStore((s) => s.role)
  const [selectedDay, setSelectedDay]   = useState<number | null>(null)
  const [showReminders, setShowReminders] = useState(false)
  const [showSeasonal, setShowSeasonal]   = useState(false)

  const locale   = language === 'en' ? 'en-US' : 'es-ES'
  const weekdays = WEEKDAY_NAMES[language] ?? WEEKDAY_NAMES.en

  const now      = new Date()
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null

  const monthName = useMemo(() => {
    const raw = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month - 1, 1))
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [year, month, locale])

  const watchlistIds = (tab === 'movies' ? watchlistMovieIds : watchlistSeriesIds) ?? EMPTY_SET

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
  const showingPanel    = showReminders || showSeasonal

  const handleOpenReminders = () => {
    setSelectedDay(null)
    setShowSeasonal(false)
    setShowReminders(true)
  }

  const handleOpenSeasonal = () => {
    setSelectedDay(null)
    setShowReminders(false)
    setShowSeasonal(true)
  }

  return (
    <div
      role="region"
      aria-label={t('calendar.title')}
      className={clsx(
        'flex flex-col flex-1 gap-2 rounded-xl border border-border bg-card p-3 select-none',
        animateFrom === 'left' ? 'animate-slide-from-left' : animateFrom === 'right' ? 'animate-slide-from-right' : 'animate-fade-in',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Text variant="body" className="font-semibold text-foreground">{t('calendar.title')}</Text>
          {!showingPanel && (
            <ContentTabToggle tab={tab} onTabChange={(t) => { onTabChange(t); setSelectedDay(null) }} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {showReminders ? (
            <CloseBar label={t('calendar.reminders')} closeLabel={t('calendar.close')} onClose={() => setShowReminders(false)} />
          ) : showSeasonal ? (
            <CloseBar label={t('seasonal.panelTitle')} closeLabel={t('calendar.close')} onClose={() => setShowSeasonal(false)} />
          ) : showingReleases ? (
            <CloseBar label={selectedDateLabel} closeLabel={t('calendar.close')} onClose={() => setSelectedDay(null)} dataCy="calendar-close" />
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
              <div className="flex items-center">
                <button aria-label={t('calendar.prevMonth')} onClick={onPrevMonth} className={ICON_BTN_CLS}>
                  <span aria-hidden="true"><ChevronLeftIcon size={14} /></span>
                </button>
                <span className="text-xs font-semibold text-foreground min-w-26 text-center">{monthName} {year}</span>
                <button aria-label={t('calendar.nextMonth')} onClick={onNextMonth} className={ICON_BTN_CLS}>
                  <span aria-hidden="true"><ChevronRightIcon size={14} /></span>
                </button>
              </div>
              <div className="flex items-center gap-0.5 ml-0.5">
                {role === 'guest' && (
                  <Tooltip content={t('seasonal.panelTitle')} placement="top">
                    <IconToggleButton
                      data-cy="calendar-seasonal"
                      active={showSeasonal}
                      aria-label={t('seasonal.panelTitle')}
                      aria-pressed={showSeasonal}
                      onClick={handleOpenSeasonal}
                    >
                      <span aria-hidden="true"><StarIcon size={13} strokeWidth={1.5} /></span>
                    </IconToggleButton>
                  </Tooltip>
                )}
                {(watchlistMovieIds !== undefined || watchlistSeriesIds !== undefined) && (
                  <Tooltip content={t('calendar.reminders')} placement="top">
                    <IconToggleButton
                      data-cy="calendar-reminders"
                      active={showReminders}
                      aria-label={t('calendar.reminders')}
                      aria-pressed={showReminders}
                      onClick={handleOpenReminders}
                    >
                      <span aria-hidden="true"><BookmarkIcon size={13} strokeWidth={1.5} /></span>
                    </IconToggleButton>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content area — relative so panels can overlay the calendar */}
      <div className="relative flex flex-col gap-2 flex-1 overflow-hidden">

        {/* Calendar (always mounted to preserve height) */}
        <div className={`flex flex-col gap-2 flex-1${showingReleases ? ' invisible' : ''}${showingPanel ? ' hidden' : ''}`}>
          <CalendarGrid
            query={query}
            year={year}
            month={month}
            weekdays={weekdays}
            watchlistIds={watchlistIds}
            todayDay={todayDay}
            selectedDay={selectedDay}
            onSelect={setSelectedDay}
            locale={locale}
          />
        </div>

        {/* Releases panel — overlays the calendar */}
        {showingReleases && !showingPanel && (
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

        {/* Seasonal panel */}
        {showSeasonal && (
          <SeasonalPanel
            month={month}
            onMovieClick={onEntryClick}
            onSeriesClick={onSeriesEntryClick}
            className="flex-1 min-h-0"
          />
        )}

        {/* Reminders panel */}
        {showReminders && (
          <RemindersPanel
            watchlistMovieIds={watchlistMovieIds ?? EMPTY_SET}
            watchlistSeriesIds={watchlistSeriesIds ?? EMPTY_SET}
            onEntryClick={onEntryClick}
            className="flex-1 min-h-0"
          />
        )}
      </div>
    </div>
  )
}
