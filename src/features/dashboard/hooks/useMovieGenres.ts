import { useQuery } from '@tanstack/react-query'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { moviesService } from '@/services/tmdb/movies'
import { genresService } from '@/services/tmdb/genres'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { buildGenreCounts } from './buildGenreCounts'

export type GenreEntry = { name: string; count: number }

const GLOBAL_PAGES = 5

export function useUserMovieGenres() {
  const userId = useUserStore((s) => s.userId) ?? ''
  const language = useLanguageStore((s) => s.language)
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'en-US'
  const watchedMovies = useWatchedStore((s) => s.movies[userId])
  const watchedIds = Object.keys(watchedMovies ?? {}).map(Number)

  return useQuery<GenreEntry[]>({
    queryKey: ['user-movie-genres', userId, watchedIds.slice().sort(), tmdbLang],
    queryFn: async () => {
      const results = await Promise.allSettled(
        watchedIds.map((id) => moviesService.detail(id, tmdbLang))
      )
      return buildGenreCounts(
        results.flatMap((r) => (r.status === 'fulfilled' ? [r.value.genres ?? []] : []))
      )
    },
    enabled: watchedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGlobalMovieGenres() {
  const language = useLanguageStore((s) => s.language)
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'en-US'

  return useQuery<GenreEntry[]>({
    queryKey: ['global-movie-genres', tmdbLang],
    queryFn: async () => {
      const [genreList, ...pages] = await Promise.all([
        genresService.movieList(tmdbLang),
        ...Array.from({ length: GLOBAL_PAGES }, (_, i) =>
          moviesService.discover(i + 1, tmdbLang)
        ),
      ])
      const genreMap = Object.fromEntries(genreList.genres.map((g) => [g.id, g.name]))
      return buildGenreCounts(
        pages.flatMap((page) =>
          page.results.map((movie) =>
            movie.genre_ids.flatMap((id) => (genreMap[id] ? [{ name: genreMap[id] }] : []))
          )
        )
      )
    },
    staleTime: Infinity,
  })
}
