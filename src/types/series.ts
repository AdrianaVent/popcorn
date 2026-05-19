import type { TMDBSeries } from './tmdb'

export type SeriesRow = Pick<
  TMDBSeries,
  'id' | 'name' | 'first_air_date' | 'vote_average' | 'vote_count' | 'poster_path' | 'original_language'
> & { status?: string; runtime?: number | null; [key: string]: unknown }

export type SeriesFilters = {
  title?: string
  vote_average_gte?: number
  first_air_year?: number
  runtime_gte?: number
  status?: string
  watched?: 'watched' | 'unwatched'
  provider_id?: string
}
