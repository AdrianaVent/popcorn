import { WATCH_PROVIDERS_REGION } from '@/config/constants'
import type { TMDBMovieDetail } from '@/types/tmdb'

export type MovieUI = {
  isUpcoming: boolean
  releaseYear: number | null
  resolvedDate: string
}

function resolveSpanishDate(detail: TMDBMovieDetail): string {
  const esEntry = detail.release_dates?.results.find((r) => r.iso_3166_1 === WATCH_PROVIDERS_REGION)
  const theatrical = esEntry?.release_dates
    .filter((rd) => rd.type === 2 || rd.type === 3)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))[0]
  return theatrical?.release_date ?? ''
}

export function getMovieUI(detail?: TMDBMovieDetail | null): MovieUI {
  if (!detail) return { isUpcoming: false, releaseYear: null, resolvedDate: '' }

  const esDate = resolveSpanishDate(detail)

  // Prioritize the Spanish theatrical date — a movie may be regionally unreleased even when
  // it has a global release_date from another country.
  if (esDate) {
    const esReleaseDate = new Date(esDate)
    if (esReleaseDate.getTime() > Date.now()) {
      return { isUpcoming: true, releaseYear: esReleaseDate.getFullYear(), resolvedDate: esDate }
    }
  }

  const dateStr = detail.release_date
  if (!dateStr) return { isUpcoming: false, releaseYear: null, resolvedDate: '' }

  const releaseDate = new Date(dateStr)
  return {
    isUpcoming: releaseDate.getTime() > Date.now(),
    releaseYear: releaseDate.getFullYear(),
    resolvedDate: dateStr,
  }
}
