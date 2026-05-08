'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker, useDayPicker } from 'react-day-picker'
import type { NavProps } from 'react-day-picker'
import { es, enUS } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import clsx from 'clsx'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { useLanguageStore } from '@/store/languageStore'
import { useThemeStore } from '@/store/themeStore'
import { resolveMode } from '@/styles/theme'
import { formatShortDate } from '@/utils/formatDate'

type Props = {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  className?: string
}

function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function YearNav({ onPreviousClick, onNextClick, previousMonth, nextMonth }: NavProps) {
  const { goToMonth, months } = useDayPicker()
  const currentMonth = months[0]?.date ?? new Date()

  const shiftYear = (delta: number) => {
    const d = new Date(currentMonth)
    d.setFullYear(d.getFullYear() + delta)
    goToMonth(d)
  }

  return (
    <nav className="rdp-nav-year">
      <div className="rdp-nav-group">
        <button type="button" onClick={() => shiftYear(-1)} className="rdp-year-btn" aria-label="Previous year">
          «
        </button>
        <button
          type="button"
          onClick={onPreviousClick}
          disabled={!previousMonth}
          className="rdp-year-btn"
          aria-label="Previous month"
        >
          <ChevronLeftIcon size={14} />
        </button>
      </div>
      <div className="rdp-nav-group">
        <button
          type="button"
          onClick={onNextClick}
          disabled={!nextMonth}
          className="rdp-year-btn"
          aria-label="Next month"
        >
          <ChevronRightIcon size={14} />
        </button>
        <button type="button" onClick={() => shiftYear(1)} className="rdp-year-btn" aria-label="Next year">
          »
        </button>
      </div>
    </nav>
  )
}

export default function DatePicker({ value, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguageStore()
  const { mode } = useThemeStore()
  const theme = resolveMode(mode)

  const locale = language === 'es' ? es : enUS
  const selected = value ? toLocalDate(value) : undefined
  const displayValue = value ? formatShortDate(value, language) : undefined
  const emptyPlaceholder = placeholder ?? (language === 'es' ? 'dd/mm/aaaa' : 'mm/dd/yyyy')

  const openPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? toISO(date) : undefined)
    setOpen(false)
  }

  return (
    <div className={clsx('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPopover}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 text-sm border rounded-md bg-background outline-none transition-colors',
          open ? 'border-primary/60' : 'border-border hover:border-primary/40',
          value ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span suppressHydrationWarning>{displayValue ?? emptyPlaceholder}</span>
        <span className="text-muted-foreground">
          <CalendarIcon size={12} />
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          data-theme={theme}
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="rounded-lg border border-border bg-card shadow-lg overflow-hidden rdp-theme"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={locale}
            components={{ Nav: YearNav }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
