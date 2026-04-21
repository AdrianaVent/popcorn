export type TMDBPagedResponse<T> = {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type TMDBMovie = {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  adult: boolean
  original_language: string
}

export type TMDBSeries = {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  origin_country: string[]
  original_language: string
}

export type TMDBGenre = {
  id: number
  name: string
}
