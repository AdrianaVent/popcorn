if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_TMDB_API_KEY')
}

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
export const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
