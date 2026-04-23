export type Column<T extends Record<string, unknown>> = {
  key: keyof T
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'flex'
}

export type FilterFieldType = 'text' | 'number' | 'boolean'

export type FilterField<T> = {
  key: keyof T
  label: string
  type: FilterFieldType
}

export type FiltersSchema<T> = FilterField<T>[]