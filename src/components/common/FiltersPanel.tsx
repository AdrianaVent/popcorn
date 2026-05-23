'use client'

import { useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import type { TFunction } from 'i18next'
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

type Props<T extends Record<string, unknown>> = {
  schema: FiltersSchema<T>
  filters: T
  onChange: (next: T) => void
  titleKey?: string
  disabled?: boolean
}


function renderSummary<T extends Record<string, unknown>>(
  field: FilterField<T>,
  value: T[keyof T],
  t: TFunction,
  language: string,
  valueTo?: T[keyof T],
): React.ReactNode {
  const label = t(field.label)

  switch (field.type) {
    case 'text': {
      const v = typeof value === 'string' ? value.trim() : ''
      if (!v) return null
      return (
        <Tooltip content={`${label}: ${v}`} placement="bottom">
          <SummaryPill>{'"'}{v}{'"'}</SummaryPill>
        </Tooltip>
      )
    }
    case 'number': {
      if (typeof value !== 'number' || value === 0) return null
      const unit = field.unit ? ` ${t(field.unit)}` : ''
      return (
        <Tooltip content={`${label}: ${value}`} placement="bottom">
          <SummaryPill>{value}{unit}</SummaryPill>
        </Tooltip>
      )
    }
    case 'star': {
      if (typeof value !== 'number' || value === 0) return null
      return (
        <Tooltip content={`${label}: ${value}/10`} placement="bottom">
          <SummaryPill>
            <StarRating value={tmdbToStarRating(value)} readonly size={11} />
          </SummaryPill>
        </Tooltip>
      )
    }
    case 'select':
    case 'searchable-select': {
      const opt = field.options?.find((o) => String(o.value) === String(value))
      if (!opt) return null
      const optLabel = t(String(opt.label))
      return (
        <Tooltip content={`${label}: ${optLabel}`} placement="bottom">
          <SummaryPill>{optLabel}</SummaryPill>
        </Tooltip>
      )
    }
    case 'genre-multi': {
      if (!Array.isArray(value) || value.length === 0) return null
      const selected = (value as number[])
        .map((id) => field.options?.find((o) => Number(o.value) === id))
        .filter((o): o is NonNullable<typeof o> => o != null)
      if (selected.length === 0) return null
      const tooltipText = `${label}: ${selected.map((o) => o.label).join(', ')}`
      return (
        <Tooltip content={tooltipText} placement="bottom">
          <SummaryPill>
            {selected.map((opt) => {
              const Icon = opt.icon ?? null
              return Icon ? <Icon key={String(opt.value)} size={10} strokeWidth={1.5} /> : null
            })}
          </SummaryPill>
        </Tooltip>
      )
    }
    case 'date': {
      const v = typeof value === 'string' ? value : ''
      if (!v) return null
      const formatted = formatShortDate(v, language)
      return (
        <Tooltip content={`${label}: ${formatted}`} placement="bottom">
          <SummaryPill>{formatted}</SummaryPill>
        </Tooltip>
      )
    }
    case 'year-range': {
      const from = typeof value === 'number' && value > 0 ? value : null
      const to = typeof valueTo === 'number' && valueTo > 0 ? valueTo : null
      if (!from && !to) return null
      const text = from && to
        ? (from === to ? String(from) : `${from}–${to}`)
        : from ? `${from} →` : `→ ${to}`
      const tooltip = from && to
        ? `${label}: ${from === to ? from : `${from}–${to}`}`
        : from ? `${label}: ≥ ${from}` : `${label}: ≤ ${to}`
      return (
        <Tooltip content={tooltip} placement="bottom">
          <SummaryPill>{text}</SummaryPill>
        </Tooltip>
      )
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
}: Props<T>) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const [open, setOpen] = useState(true)

  const activeCount = schema.filter((field) => {
    const val = filters[field.key]
    if (field.type === 'genre-multi') return Array.isArray(val) && (val as unknown[]).length > 0
    if (field.type === 'year-range') {
      const valTo = field.keyTo ? filters[field.keyTo] : undefined
      return (val !== undefined && val !== null && val !== '') ||
             (valTo !== undefined && valTo !== null && valTo !== '')
    }
    if (val === undefined || val === null || val === '') return false
    if (typeof val === 'number' && val === 0) return false
    return true
  }).length

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

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer text-left"
        >
          <Text variant="small" className="font-semibold text-foreground shrink-0">
            {t(titleKey)}
          </Text>

          {!open && activeCount > 0 && (
            <div className="flex flex-wrap items-center gap-1 min-w-0 animate-fade-in">
              {schema.map((field) => (
                <Fragment key={String(field.key)}>
                  {renderSummary(field, filters[field.key], t, language, field.keyTo ? filters[field.keyTo] : undefined)}
                </Fragment>
              ))}
            </div>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {activeCount > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-md px-1.5 py-0.5 hover:bg-muted transition-colors cursor-pointer"
            >
              <XIcon size={11} />
              {t('common.clearFilters')}
            </button>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className={clsx('text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          >
            <ChevronDownIcon size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="grid"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 300ms ease-in-out' }}
      >
        <div className="overflow-hidden min-h-0">
        <div
          className="flex items-center gap-4 px-4 pb-3 border-t border-border pt-3 overflow-x-auto"
          style={{ opacity: open ? 1 : 0, transition: 'opacity 200ms ease-in-out' }}
        >
          {schema.map((field, index) => (
            <div key={String(field.key)} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {t(field.label)}
              </span>
              <FilterFieldInput field={field} value={filters[field.key]} filters={filters} onChange={onChange} />
              {index < schema.length - 1 && (
                <div className="w-px h-6 bg-border mx-2" />
              )}
            </div>
          ))}
        </div>
        </div>
      </div>

    </div>
  )
}
