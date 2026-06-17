'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchPersonCredits } from '@/features/person/person.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBPersonCombinedCredits } from '@/types/tmdb'

export function usePersonCredits(id: number | null) {
  const { language } = useLanguageStore()

  const { data, isLoading } = useQuery<TMDBPersonCombinedCredits>({
    queryKey: ['person-credits', id, language],
    queryFn: () => fetchPersonCredits(id!, language),
    enabled: id !== null,
    staleTime: 1000 * 60 * 60 * 24,
  })

  return {
    cast: data?.cast ?? [],
    crew: data?.crew ?? [],
    loading: isLoading,
  }
}
