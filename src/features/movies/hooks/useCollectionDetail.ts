'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBCollectionDetail } from '@/types/tmdb'

export function useCollectionDetail(collectionId: number | null, enabled: boolean) {
  const { language } = useLanguageStore()

  const { data: detail, isLoading, isError } = useQuery<TMDBCollectionDetail>({
    queryKey: ['collection-detail', collectionId, language],
    queryFn: () => fetchCollectionDetail(collectionId!, language),
    enabled: enabled && collectionId !== null,
  })

  return { detail: detail ?? null, loading: isLoading, error: isError ? 'TMDB_FETCH_ERROR' : null }
}
