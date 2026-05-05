'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Text from '@/components/ui/Text'
import DatePicker from '@/components/ui/DatePicker'
import { ChevronDownIcon } from '@/components/icons'
import type { FiltersSchema } from '@/types/table'
import { updateFilterValue } from '@/utils/updateFilterValue'

type Props<T extends Record<string, unknown>> = {
  schema: FiltersSchema<T>
  filters: T
  onChange: (next: T) => void
  titleKey?: string
}

export default function FiltersPanel<T extends Record<string, unknown>>({
  schema,
  filters,
  onChange,
  titleKey = 'movies.filters.panel',
}: Props<T>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  const activeCount = schema.filter(({ key }) => {
    const val = filters[key]
    if (val === undefined || val === null || val === '') return false
    if (typeof val === 'number' && val === 0) return false
    return true
  }).length

  return (
    <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm overflow-hidden">

      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Text variant="small" className="font-semibold text-foreground">
            {t(titleKey)}
          </Text>

          {!open && activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold leading-none">
              {activeCount}
            </span>
          )}
        </div>

        <span
          className={clsx(
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        >
          <ChevronDownIcon size={15} />
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="flex items-center gap-4 px-4 pb-3 border-t border-border pt-3 overflow-x-auto">
          {schema.map((field, index) => {
            const value = filters[field.key]

            return (
              <div key={String(field.key)} className="flex items-center gap-2">

                <Text variant="small" className="text-muted-foreground whitespace-nowrap">
                  {t(field.label)}
                </Text>

                {field.type === 'text' && (
                  <input
                    data-cy={`filter-${String(field.key)}`}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) =>
                      onChange(
                        updateFilterValue(filters, field.key, e.target.value as T[keyof T])
                      )
                    }
                    className="w-44 px-2 py-1 text-sm border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors"
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
                    className="w-16 px-2 py-1 text-sm border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors"
                  />
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
                    className="px-2 py-1 text-sm border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors cursor-pointer"
                  >
                    <option value="">{t('common.all')}</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(String(opt.label))}
                      </option>
                    ))}
                  </select>
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
