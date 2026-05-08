import { tmdbFetch } from './client'
import type { TMDBGenre } from '@/types/tmdb'

export const genresService = {
  movieList: (language: string) =>
    tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list', { language }),

  seriesList: (language: string) =>
    tmdbFetch<{ genres: TMDBGenre[] }>('/genre/tv/list', { language }),
}
