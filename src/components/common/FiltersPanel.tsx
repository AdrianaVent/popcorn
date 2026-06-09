'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Text from '@/components/ui/Text'
import FilterFieldInput from '@/components/ui/FilterFieldInput'
import SummaryPill from '@/components/ui/SummaryPill'
import Tooltip from '@/components/ui/Tooltip'
import StarRating from '@/components/ui/StarRating'
import { ChevronDownIcon, XIcon } from '@/components/icons'
import type { FilterField, FiltersSchema } from '@/types/table'
import { tmdbToStarRating } from '@/utils/formatNumber'
import { formatShortDate } from '@/utils/formatDate'
import { useLanguageStore } from '@/store/languageStore'

type FiltersPanelProps<T extends Record<string, unknown>> = {
  schema: FiltersSchema<T>
  filters: T
  onChange: (next: T) => void
  titleKey?: string
  disabled?: boolean
}

function isFieldActive<T extends Record<string, unknown>>(field: FilterField<T>, filters: T): boolean {
  const val = filters[field.key]
  if (field.type === 'genre-multi') return Array.isArray(val) && (val as unknown[]).length > 0
  if (field.type === 'year-range') {
    const valTo = field.keyTo ? filters[field.keyTo] : undefined
    return (val != null && val !== '') || (valTo != null && valTo !== '')
  }
  if (val == null || val === '') return false
  if (typeof val === 'number' && val === 0) return false
  return true
}

function ActivePill({ tooltip, children }: { tooltip: string; children: React.ReactNode }) {
  return (
    <Tooltip content={tooltip} placement="bottom">
      <SummaryPill>{children}</SummaryPill>
    </Tooltip>
  )
}

function FieldSummary<T extends Record<string, unknown>>({
  field, value, valueTo,
}: {
  field: FilterField<T>
  value: T[keyof T]
  valueTo?: T[keyof T]
}) {
  const { t } = useTranslation()
  const language = useLanguageStore((s) => s.language)
  const label = t(field.label)

  switch (field.type) {
    case 'text': {
      const v = typeof value === 'string' ? value.trim() : ''
      if (!v) return null
      return <ActivePill tooltip={`${label}: ${v}`}>{'"'}{v}{'"'}</ActivePill>
    }
    case 'number': {
      if (typeof value !== 'number' || value === 0) return null
      let display: string
      if (field.units?.length) {
        const u = [...field.units].sort((a, b) => b.multiplier - a.multiplier).find((u) => value >= u.multiplier && value % u.multiplier === 0) ?? field.units[field.units.length - 1]
        display = `${value / u.multiplier} ${t(u.label)}`
      } else {
        display = `${value}${field.unit ? ` ${t(field.unit)}` : ''}`
      }
      return <ActivePill tooltip={`${label}: ${display}`}>{display}</ActivePill>
    }
    case 'star': {
      if (typeof value !== 'number' || value === 0) return null
      return (
        <ActivePill tooltip={`${label}: ${value}/10`}>
          <StarRating value={tmdbToStarRating(value)} readonly size={11} />
        </ActivePill>
      )
    }
    case 'select':
    case 'searchable-select': {
      const opt = field.options?.find((o) => String(o.value) === String(value))
      if (!opt) return null
      const optLabel = t(String(opt.label))
      return <ActivePill tooltip={`${label}: ${optLabel}`}>{optLabel}</ActivePill>
    }
    case 'genre-multi': {
      if (!Array.isArray(value) || value.length === 0) return null
      const selected = (value as number[])
        .map((id) => field.options?.find((o) => Number(o.value) === id))
        .filter((o): o is NonNullable<typeof o> => o != null)
      if (selected.length === 0) return null
      return (
        <ActivePill tooltip={`${label}: ${selected.map((o) => o.label).join(', ')}`}>
          {selected.map((opt) => { const Icon = opt.icon; return Icon ? <Icon key={String(opt.value)} size={10} strokeWidth={1.5} /> : null })}
        </ActivePill>
      )
    }
    case 'date': {
      const v = typeof value === 'string' ? value : ''
      if (!v) return null
      const formatted = formatShortDate(v, language)
      return <ActivePill tooltip={`${label}: ${formatted}`}>{formatted}</ActivePill>
    }
    case 'year-range': {
      const from = typeof value === 'number' && value > 0 ? value : null
      const to = typeof valueTo === 'number' && valueTo > 0 ? valueTo : null
      if (!from && !to) return null
      const range   = from === to ? String(from) : `${from}–${to}`
      const text    = from && to ? range : from ? `${from} →` : `→ ${to}`
      const tooltip = from && to ? `${label}: ${range}` : from ? `${label}: ≥ ${from}` : `${label}: ≤ ${to}`
      return <ActivePill tooltip={tooltip}>{text}</ActivePill>
    }
    default:
      return null
  }
}

export default function FiltersPanel<T extends Record<string, unknown>>({
  schema,
  filters,
  onChange,
  titleKey = 'movies.filters.panel',
  disabled = false,
}: FiltersPanelProps<T>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  const activeCount = schema.filter((field) => isFieldActive(field, filters)).length

  const handleClear = () => {
    const cleared = schema.reduce((acc, field) => ({
      ...acc,
      [field.key]: field.type === 'boolean' ? false
        : field.type === 'number' || field.type === 'star' ? 0
        : field.type === 'genre-multi' ? []
        : '',
      ...(field.type === 'year-range' && field.keyTo ? { [field.keyTo]: '' } : {}),
    }), { ...filters })
    onChange(cleared as T)
  }

  return (
    <div className={clsx('rounded-lg border border-border bg-card/60 backdrop-blur-sm overflow-hidden', disabled && 'opacity-50 pointer-events-none')}>

      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer text-left"
        >
          <Text variant="small" className="font-semibold text-foreground shrink-0">
            {t(titleKey)}
          </Text>
          {!open && activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-1 min-w-0 animate-fade-in">
              {schema.map((field) => (
                <FieldSummary key={String(field.key)} field={field} value={filters[field.key]} valueTo={field.keyTo ? filters[field.keyTo] : undefined} />
              ))}
            </div>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            data-cy="clear-filters"
            onClick={handleClear}
            aria-label={t('common.clearFilters')}
            className={clsx(
              'flex items-center gap-1 text-[11px] border rounded-md px-1.5 py-0.5 transition-colors cursor-pointer',
              activeCount > 0
                ? 'text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                : 'invisible pointer-events-none border-transparent',
            )}
          >
            <XIcon size={11} aria-hidden />
            <span aria-hidden="true">{t('common.clearFilters')}</span>
          </button>

          <span
            aria-hidden="true"
            onClick={() => setOpen((v) => !v)}
            className={clsx('text-muted-foreground transition-transform duration-200 cursor-pointer', open && 'rotate-180')}
          >
            <ChevronDownIcon size={15} />
          </span>
        </div>
      </div>

      <div
        className="grid"
        aria-hidden={!open}
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 300ms ease-in-out' }}
      >
        <div className="overflow-hidden min-h-0">
          <div
            role="group"
            aria-label={t(titleKey)}
            className="overflow-x-auto px-4 pb-3 border-t border-border pt-3"
            style={{ opacity: open ? 1 : 0, transition: 'opacity 200ms ease-in-out' }}
          >
            <div className="flex items-center gap-4 min-w-max w-full">
              {schema.map((field, index) => {
                const fieldLabel = t(field.label)
                return (
                  <div key={String(field.key)} className={clsx('flex items-center gap-2', field.grow && 'flex-1 min-w-45')}>
                    <span aria-hidden="true" className="text-xs text-muted-foreground whitespace-nowrap">
                      {fieldLabel}
                    </span>
                    <FilterFieldInput field={field} value={filters[field.key]} filters={filters} onChange={onChange} ariaLabel={fieldLabel} />
                    {index < schema.length - 1 && (
                      <div aria-hidden="true" className="w-px h-6 bg-border mx-2" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
