import type { TMDBMovieDetail } from '@/types/tmdb'

export type MovieUI = {
  isUpcoming: boolean
  releaseYear: number | null
}

export function getMovieUI(detail?: TMDBMovieDetail | null): MovieUI {
  if (!detail?.release_date) {
    return { isUpcoming: false, releaseYear: null }
  }

  const releaseDate = new Date(detail.release_date)

  return {
    isUpcoming: releaseDate.getTime() > Date.now(),
    releaseYear: releaseDate.getFullYear(),
  }
}
