import type { ReactNode, ComponentType, CSSProperties } from 'react'

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

export type FilterFieldType = 'text' | 'number' | 'boolean' | 'select' | 'date' | 'star' | 'genre-multi'

export type FilterOption = {
  value: string | number
  label: string
  icon?: ComponentType<{ size?: number; strokeWidth?: number; color?: string; style?: CSSProperties }>
}

export type FilterField<T> = {
  key: keyof T
  label: string
  type: FilterFieldType
  options?: FilterOption[]
  min?: number
  max?: number
  unit?: string
}

export type FiltersSchema<T> = FilterField<T>[]