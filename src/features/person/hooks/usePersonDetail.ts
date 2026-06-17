'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPersonDetail } from '@/features/person/person.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBPerson } from '@/types/tmdb'

export function usePersonDetail(id: number | null) {
  const { language } = useLanguageStore()

  const { data, isLoading, isError } = useQuery<TMDBPerson>({
    queryKey: ['person-detail', id, language],
    queryFn: () => fetchPersonDetail(id!, language),
    enabled: id !== null,
    staleTime: 1000 * 60 * 60 * 24,
  })

  return { person: data ?? null, loading: isLoading, error: isError ? 'TMDB_FETCH_ERROR' : null }
}
