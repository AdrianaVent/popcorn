'use client'

import { useTranslation } from 'react-i18next'
import DatePicker from '@/components/ui/DatePicker'
import StarRating from '@/components/ui/StarRating'
import MultiSelectChips from '@/components/ui/MultiSelectChips'
import SearchableSelect from '@/components/ui/SearchableSelect'
import YearRangePicker from '@/components/ui/YearRangePicker'
import type { FilterField } from '@/types/table'
import { updateFilterValue } from '@/utils/updateFilterValue'
import { tmdbToStarRating } from '@/utils/formatNumber'

type Props<T extends Record<string, unknown>> = {
  field: FilterField<T>
  value: T[keyof T]
  filters: T
  onChange: (next: T) => void
}

export default function FilterFieldInput<T extends Record<string, unknown>>({ field, value, filters, onChange }: Props<T>) {
  const { t } = useTranslation()

  switch (field.type) {
    case 'text':
      return (
        <input
          data-cy={`filter-${String(field.key)}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(updateFilterValue(filters, field.key, e.target.value as T[keyof T]))}
          className="w-44 px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors"
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          min={field.min}
          max={field.max}
          onChange={(e) =>
            onChange(updateFilterValue(filters, field.key, (e.target.value ? Number(e.target.value) : '') as T[keyof T]))
          }
          className="w-16 px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground outline-none focus:border-primary/50 transition-colors"
        />
      )

    case 'star':
      return (
        <div data-cy={`filter-${String(field.key)}`} className="flex items-center gap-1.5">
          <StarRating
            value={typeof value === 'number' && value > 0 ? tmdbToStarRating(value) : null}
            onChange={(rating) => onChange(updateFilterValue(filters, field.key, (rating * 2) as T[keyof T]))}
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
      )

    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(updateFilterValue(filters, field.key, e.target.checked as T[keyof T]))}
        />
      )

    case 'date':
      return (
        <DatePicker
          value={typeof value === 'string' && value ? value : undefined}
          onChange={(v) => onChange(updateFilterValue(filters, field.key, (v ?? '') as T[keyof T]))}
        />
      )

    case 'select':
      if (!field.options) return null
      return (
        <select
          data-cy={`filter-${String(field.key)}`}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) =>
            onChange(updateFilterValue(filters, field.key, (e.target.value || undefined) as T[keyof T]))
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
      )

    case 'searchable-select':
      if (!field.options) return null
      return (
        <SearchableSelect
          options={field.options}
          value={typeof value === 'string' || typeof value === 'number' ? value : null}
          onChange={(next) => onChange(updateFilterValue(filters, field.key, (next ?? '') as T[keyof T]))}
          placeholder={t('common.all')}
          searchPlaceholder={t('common.search')}
        />
      )

    case 'year-range':
      if (!field.options || !field.keyTo) return null
      return (
        <YearRangePicker
          options={field.options}
          valueFrom={typeof value === 'number' ? value : null}
          valueTo={typeof filters[field.keyTo] === 'number' ? filters[field.keyTo] as number : null}
          onChangeFrom={(v) => onChange(updateFilterValue(filters, field.key, (v ?? '') as T[keyof T]))}
          onChangeTo={(v) => onChange(updateFilterValue(filters, field.keyTo!, (v ?? '') as T[keyof T]))}
        />
      )

    case 'genre-multi':
      if (!field.options) return null
      return (
        <div data-cy={`filter-${String(field.key)}`}>
          <MultiSelectChips
            options={field.options}
            value={Array.isArray(value) ? (value as number[]) : []}
            onChange={(next) => onChange(updateFilterValue(filters, field.key, next as T[keyof T]))}
            placeholder={t('common.all')}
          />
        </div>
      )

    default:
      return null
  }
}
