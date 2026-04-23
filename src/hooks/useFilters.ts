import { useState } from 'react'

export function useFilters<T extends Record<string, unknown>>(initial: T) {
  const [filters, setFilters] = useState<T>(initial)

  return {
    filters,
    setFilters,
  }
}