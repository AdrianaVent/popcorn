import { peopleService } from '@/services/tmdb'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import type { TMDBPerson, TMDBPersonCombinedCredits } from '@/types/tmdb'

export function fetchPersonDetail(id: number, language = 'es'): Promise<TMDBPerson> {
  return peopleService.detail(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}

export function fetchPersonCredits(id: number, language = 'es'): Promise<TMDBPersonCombinedCredits> {
  return peopleService.combinedCredits(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}
