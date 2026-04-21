import { TMDB_IMAGE_BASE_URL } from '@/services/tmdb/config'

export type TMDBImageSize =
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'original'

export function getTMDBImageUrl(
  path: string | null,
  size: TMDBImageSize = 'w500'
): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}
