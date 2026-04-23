import { moviesService } from '@/services/tmdb'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import type { MovieFilters } from '@/types/movie'
import type { TMDBCollectionDetail, TMDBPagedResponse, TMDBMovie, TMDBMovieDetail } from '@/types/tmdb'

export function fetchMovies(
  page = 1,
  language = 'es',
  filters?: MovieFilters
): Promise<TMDBPagedResponse<TMDBMovie>> {
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'

  if (filters?.title) {
    // Use search endpoint so pagination reflects real title matches
    // release_year is supported by /search/movie; vote_average_gte is applied client-side
    return moviesService.search(filters.title, page, tmdbLang)
  }

  const params: Record<string, string | number> = {
    with_original_language: 'en|es',
  }
  if (filters?.vote_average_gte) params['vote_average.gte'] = filters.vote_average_gte
  if (filters?.release_year)     params['primary_release_year'] = filters.release_year
  return moviesService.discover(page, tmdbLang, params)
}

export function fetchMovieDetail(id: number, language = 'es'): Promise<TMDBMovieDetail> {
  return moviesService.detail(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}

export function fetchCollectionDetail(id: number, language = 'es'): Promise<TMDBCollectionDetail> {
  return moviesService.collection(id, TMDB_LANGUAGE[language] ?? 'es-ES')
}
