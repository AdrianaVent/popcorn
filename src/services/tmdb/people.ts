import { tmdbFetch } from './client'
import { DEFAULT_LANGUAGE } from '@/config/constants'
import type { TMDBPerson, TMDBPersonCombinedCredits } from '@/types/tmdb'

export const peopleService = {
  detail: (id: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPerson>(`/person/${id}`, { language }),

  combinedCredits: (id: number, language = DEFAULT_LANGUAGE) =>
    tmdbFetch<TMDBPersonCombinedCredits>(`/person/${id}/combined_credits`, { language }),
}
