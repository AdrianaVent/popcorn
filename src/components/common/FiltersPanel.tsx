'use client'

import { useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import type { TFunction } from 'i18next'
import Text from '@/components/ui/Text'
import DatePicker from '@/components/ui/DatePicker'
import StarRating from '@/components/ui/StarRating'
import MultiSelectChips from '@/components/ui/MultiSelectChips'
import SummaryPill from '@/components/ui/SummaryPill'
import Tooltip from '@/components/ui/Tooltip'
import { ChevronDownIcon, XIcon } from '@/components/icons'
import type { FilterField, FiltersSchema } from '@/types/table'
import { updateFilterValue } from '@/utils/updateFilterValue'
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
    case 'select': {
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

  const activeCount = schema.filter(({ key, type }) => {
    const val = filters[key]
    if (type === 'genre-multi') return Array.isArray(val) && (val as unknown[]).length > 0
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
            <div className="flex flex-wrap items-center gap-1 min-w-0">
              {schema.map((field) => (
                <Fragment key={String(field.key)}>
                  {renderSummary(field, filters[field.key], t, language)}
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
      {open && (
        <div className="flex items-center gap-4 px-4 pb-3 border-t border-border pt-3 overflow-x-auto">
          {schema.map((field, index) => {
            const value = filters[field.key]

            return (
              <div key={String(field.key)} className="flex items-center gap-2">

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t(field.label)}
                </span>

                {field.type === 'text' && (
                  <input
                    data-cy={`filter-${String(field.key)}`}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) =>
                      onChange(
                        updateFilterValue(filters, field.key, e.target.value as T[keyof T])
                      )
                    }
                    className="w-44 px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={typeof value === 'number' ? value : ''}
                    min={field.min}
                    max={field.max}
                    onChange={(e) =>
                      onChange(
                        updateFilterValue(
                          filters,
                          field.key,
                          (e.target.value ? Number(e.target.value) : '') as T[keyof T]
                        )
                      )
                    }
                    className="w-16 px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                )}

                {field.type === 'star' && (
                  <div data-cy={`filter-${String(field.key)}`} className="flex items-center gap-1.5">
                    <StarRating
                      value={typeof value === 'number' && value > 0 ? tmdbToStarRating(value) : null}
                      onChange={(rating) =>
                        onChange(updateFilterValue(filters, field.key, (rating * 2) as T[keyof T]))
                      }
                      size={16}
                    />
                    {typeof value === 'number' && value > 0 && (
                      <button
                        onClick={() => onChange(updateFilterValue(filters, field.key, 0 as T[keyof T]))}
                        className="text-[13px] leading-none text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}

                {field.type === 'boolean' && (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) =>
                      onChange(
                        updateFilterValue(filters, field.key, e.target.checked as T[keyof T])
                      )
                    }
                  />
                )}

                {field.type === 'date' && (
                  <DatePicker
                    value={typeof value === 'string' && value ? value : undefined}
                    onChange={(v) => onChange(updateFilterValue(filters, field.key, (v ?? '') as T[keyof T]))}
                  />
                )}

                {field.type === 'select' && field.options && (
                  <select
                    data-cy={`filter-${String(field.key)}`}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) =>
                      onChange(
                        updateFilterValue(filters, field.key, (e.target.value || undefined) as T[keyof T])
                      )
                    }
                    className="px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="">{t('common.all')}</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(String(opt.label))}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'genre-multi' && field.options && (
                  <div data-cy={`filter-${String(field.key)}`}>
                    <MultiSelectChips
                      options={field.options}
                      value={Array.isArray(value) ? (value as number[]) : []}
                      onChange={(next) =>
                        onChange(updateFilterValue(filters, field.key, next as T[keyof T]))
                      }
                      placeholder={t('common.all')}
                    />
                  </div>
                )}

                {index < schema.length - 1 && (
                  <div className="w-px h-6 bg-border mx-2" />
                )}

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
