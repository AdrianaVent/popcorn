import type { TMDBMovie } from './tmdb'

export type MovieRow = Pick<
  TMDBMovie,
  'id' | 'title' | 'release_date' | 'vote_average' | 'vote_count' | 'poster_path' | 'original_language'
> & { [key: string]: unknown }

export type MovieFilters = {
  title?: string
  vote_average_gte?: number
  release_year?: number
  watched?: 'watched' | 'unwatched'
}