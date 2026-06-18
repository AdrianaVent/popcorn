import { useMemo } from 'react'
import type { FiltersSchema, FilterOption } from '@/types/table'
import type { WatchProvider } from '@/types/tmdb'

type Options = {
  role: string | null
  providerOptions: WatchProvider[] | undefined
  genreOptions: FilterOption[]
}

export function useFilterSchema<T extends Record<string, unknown>>(
  staticSchema: FiltersSchema<T>,
  { role, providerOptions, genreOptions }: Options,
): FiltersSchema<T> {
  return useMemo(() => staticSchema.flatMap((field) => {
    const key = String(field.key)
    if (key === 'watched' && role === 'admin') return []
    if (key === 'provider_id' && providerOptions?.length) {
      return [{ ...field, options: providerOptions.map((p) => ({ value: String(p.provider_id), label: p.provider_name })) }]
    }
    if (key === 'genre_ids') {
      return [{ ...field, options: genreOptions }]
    }
    return [field]
  }), [staticSchema, role, providerOptions, genreOptions])
}
