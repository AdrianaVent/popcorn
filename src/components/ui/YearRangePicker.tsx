'use client'

import { useTranslation } from 'react-i18next'
import SearchableSelect from './SearchableSelect'
import type { FilterOption } from '@/types/table'

type Props = {
  options: FilterOption[]
  valueFrom: number | null
  valueTo: number | null
  onChangeFrom: (v: number | null) => void
  onChangeTo: (v: number | null) => void
  ariaLabel?: string
}

export default function YearRangePicker({ options, valueFrom, valueTo, onChangeFrom, onChangeTo, ariaLabel }: Props) {
  const { t } = useTranslation()

  const fromOptions = valueTo !== null
    ? options.filter((o) => Number(o.value) <= valueTo)
    : options

  const toOptions = valueFrom !== null
    ? options.filter((o) => Number(o.value) >= valueFrom)
    : options

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={ariaLabel}>
      <SearchableSelect
        options={fromOptions}
        value={valueFrom}
        onChange={(v) => onChangeFrom(v !== null && v !== '' ? Number(v) : null)}
        placeholder={t('common.all')}
        searchPlaceholder={t('common.search')}
        ariaLabel={ariaLabel ? `${ariaLabel} ${t('common.prev')}` : undefined}
      />
      <span aria-hidden="true" className="text-xs text-muted-foreground select-none">–</span>
      <SearchableSelect
        options={toOptions}
        value={valueTo}
        onChange={(v) => onChangeTo(v !== null && v !== '' ? Number(v) : null)}
        placeholder={t('common.all')}
        searchPlaceholder={t('common.search')}
        ariaLabel={ariaLabel ? `${ariaLabel} ${t('common.next')}` : undefined}
      />
    </div>
  )
}
