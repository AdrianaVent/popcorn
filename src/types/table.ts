export type Column<T extends Record<string, unknown>> = {
  key: keyof T
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'flex'
}

export type FilterFieldType = 'text' | 'number' | 'boolean' | 'select' | 'date'

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