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

export type TMDBCollection = {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
}

export type TMDBCollectionPart = {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}

export type TMDBCollectionDetail = TMDBCollection & {
  overview: string
  parts: TMDBCollectionPart[]
}

export type TMDBMovieDetail = TMDBMovie & {
  tagline: string
  runtime: number | null
  status: string
  genres: TMDBGenre[]
  belongs_to_collection: TMDBCollection | null
  budget: number
  revenue: number
  homepage: string | null
}

export type TMDBCreator = {
  id: number
  name: string
  profile_path: string | null
}

export type TMDBNetwork = {
  id: number
  name: string
  logo_path: string | null
  origin_country: string
}

export type TMDBSeason = {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string | null
  poster_path: string | null
  overview: string
}

export type TMDBEpisode = {
  id: number
  name: string
  episode_number: number
  runtime: number | null
  air_date: string | null
  overview: string
  still_path: string | null
}

export type TMDBSeasonDetail = TMDBSeason & {
  episodes: TMDBEpisode[]
}

export type TMDBSeriesDetail = TMDBSeries & {
  tagline: string
  status: string
  genres: TMDBGenre[]
  number_of_seasons: number
  number_of_episodes: number
  episode_run_time: number[]
  last_air_date: string
  in_production: boolean
  networks: TMDBNetwork[]
  created_by: TMDBCreator[]
  seasons: TMDBSeason[]
  next_episode_to_air: { air_date: string } | null
  last_episode_to_air: { runtime: number | null } | null
}

export type WatchProvider = {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
}

export type WatchProvidersResult = {
  results: {
    ES?: {
      flatrate?: WatchProvider[]
      rent?: WatchProvider[]
      buy?: WatchProvider[]
    }
  }
}

export type ReleaseDate = {
  release_date: string
  type: number // 1=Premiere 2=Theatrical(limited) 3=Theatrical 4=Digital 5=Physical 6=TV
}

export type ReleaseDatesResult = {
  results: Array<{ iso_3166_1: string; release_dates: ReleaseDate[] }>
}
