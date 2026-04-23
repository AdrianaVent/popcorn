'use client'

import { useAsync } from '@/hooks/useAsync'
import { fetchCollectionDetail } from './movies.service'
import { useLanguageStore } from '@/store/languageStore'
import type { TMDBCollectionDetail } from '@/types/tmdb'

export function useCollectionDetail(collectionId: number | null, enabled: boolean) {
  const { language } = useLanguageStore()

  const { data: detail, loading, error } = useAsync<TMDBCollectionDetail>(
    () => (enabled && collectionId !== null ? fetchCollectionDetail(collectionId, language) : null),
    [collectionId, language, enabled],
  )

  return { detail, loading, error }
}
