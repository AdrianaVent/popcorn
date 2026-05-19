import type { ReactNode } from 'react'

export type SortDir = 'asc' | 'desc'
export type SortState<T> = { key: keyof T; dir: SortDir }

export type Column<T extends Record<string, unknown>> = {
  key: keyof T
  header: string
  headerNode?: ReactNode
  render?: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'flex'
  sortable?: boolean
}

export type FilterFieldType = 'text' | 'number' | 'boolean' | 'select' | 'date' | 'star'

export type FilterOption = { value: string | number; label: string }

export type FilterField<T> = {
  key: keyof T
  label: string
  type: FilterFieldType
  options?: FilterOption[]
  min?: number
  max?: number
}

export type FiltersSchema<T> = FilterField<T>[]