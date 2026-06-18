import type { TMDBMovie } from './tmdb'

export type MovieRow = Pick<
  TMDBMovie,
  'id' | 'title' | 'release_date' | 'vote_average' | 'vote_count' | 'poster_path' | 'original_language' | 'genre_ids'
> & { runtime?: number | null; [key: string]: unknown }

export type MovieFilters = {
  title?: string
  vote_average_gte?: number
  release_year_gte?: number
  release_year_lte?: number
  runtime_gte?: number
  watched?: 'watched' | 'unwatched'
  provider_id?: string
  genre_ids?: number[]
  in_theaters?: boolean
}