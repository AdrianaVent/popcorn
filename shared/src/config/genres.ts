type GenreNames = { en: string; es: string }

// Unified genre map covering both TMDB movie and TV genre IDs.
// Overlapping concepts (Action vs Action & Adventure, Sci-Fi vs Sci-Fi & Fantasy, etc.)
// are normalised to a single name so charts and detail modals are consistent.
export const GENRE_MAP: Record<number, GenreNames> = {
  // Shared IDs (same in both movie and TV)
  16:    { en: 'Animation',   es: 'Animación' },
  35:    { en: 'Comedy',      es: 'Comedia' },
  80:    { en: 'Crime',       es: 'Crimen' },
  99:    { en: 'Documentary', es: 'Documental' },
  18:    { en: 'Drama',       es: 'Drama' },
  10751: { en: 'Family',      es: 'Familia' },
  9648:  { en: 'Mystery',     es: 'Misterio' },
  37:    { en: 'Western',     es: 'Western' },

  // Unified: Movie Action (28) + Movie Adventure (12) + TV Action & Adventure (10759)
  28:    { en: 'Action & Adventure', es: 'Acción y aventura' },
  12:    { en: 'Action & Adventure', es: 'Acción y aventura' },
  10759: { en: 'Action & Adventure', es: 'Acción y aventura' },

  // Unified: Movie Science Fiction (878) + Movie Fantasy (14) + TV Sci-Fi & Fantasy (10765)
  878:   { en: 'Sci-Fi & Fantasy', es: 'Ciencia ficción y fantasía' },
  14:    { en: 'Sci-Fi & Fantasy', es: 'Ciencia ficción y fantasía' },
  10765: { en: 'Sci-Fi & Fantasy', es: 'Ciencia ficción y fantasía' },

  // Unified: Movie War (10752) + TV War & Politics (10768)
  10752: { en: 'War & Politics', es: 'Guerra y política' },
  10768: { en: 'War & Politics', es: 'Guerra y política' },

  // Movie-only
  27:    { en: 'Horror',      es: 'Terror' },
  10749: { en: 'Romance',     es: 'Romance' },
  53:    { en: 'Thriller',    es: 'Suspense' },
  36:    { en: 'History',     es: 'Historia' },
  10402: { en: 'Music',       es: 'Música' },
  10770: { en: 'TV Movie',    es: 'Película de TV' },

  // TV-only
  10762: { en: 'Kids',        es: 'Niños' },
  10763: { en: 'News',        es: 'Noticias' },
  10764: { en: 'Reality',     es: 'Reality' },
  10766: { en: 'Soap',        es: 'Telenovela' },
  10767: { en: 'Talk',        es: 'Tertulias' },
}

export function resolveGenreName(id: number, language: string, fallback?: string): string {
  const entry = GENRE_MAP[id]
  if (!entry) return fallback ?? ''
  return language === 'es' ? entry.es : entry.en
}

export function buildGenreMapForLanguage(language: string): Record<number, string> {
  return Object.fromEntries(
    Object.keys(GENRE_MAP).map((id) => [Number(id), resolveGenreName(Number(id), language)])
  )
}

// Groups of TMDB genre IDs that represent the same concept across movies and TV
const GENRE_GROUPS: number[][] = [
  [28, 12, 10759], // Action & Adventure
  [878, 14, 10765], // Sci-Fi & Fantasy
  [10752, 10768], // War & Politics
]

export function getEquivalentGenreIds(id: number): number[] {
  return GENRE_GROUPS.find((g) => g.includes(id)) ?? [id]
}

// Canonical genre IDs for the movie genre filter (one per concept, movie-native IDs first)
export const MOVIE_GENRE_IDS: number[] = [28, 16, 35, 80, 99, 18, 10751, 36, 27, 10402, 9648, 10749, 878, 53, 10770, 10752, 37]

// Canonical genre IDs for the series genre filter (TV-native IDs for shared concepts)
export const SERIES_GENRE_IDS: number[] = [10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10766, 10767, 10768, 37]
