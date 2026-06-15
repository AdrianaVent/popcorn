import { useQuery } from '@tanstack/react-query'
import { moviesService } from '@/services/tmdb/movies'
import { seriesService } from '@/services/tmdb/series'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { SEASONAL_CONFIG } from '@/config/seasonal'
import type { TMDBMovie, TMDBSeries } from '@/types/tmdb'

const STALE_TIME = 1000 * 60 * 60 * 24 // 24h
const PAGES = [1, 2, 3, 4, 5]

export function useSeasonalRecommendations(month: number, language: string) {
  const config = SEASONAL_CONFIG[month]
  const tmdbLang = TMDB_LANGUAGE[language] ?? TMDB_LANGUAGE.en

  const moviesQuery = useQuery<TMDBMovie[]>({
    queryKey: ['seasonal', 'movies', month, language],
    queryFn: async () => {
      const movieParams = {
        with_genres: config.movieGenres.join('|'),
        'vote_count.gte': 100,
        'vote_average.gte': 6,
      }
      const pages = await Promise.all(PAGES.map((p) => moviesService.discover(p, tmdbLang, movieParams)))
      return pages.flatMap((r) => r.results)
    },
    staleTime: STALE_TIME,
  })

  const seriesQuery = useQuery<TMDBSeries[]>({
    queryKey: ['seasonal', 'series', month, language],
    queryFn: async () => {
      const seriesParams: Record<string, string | number> = {
        with_genres: config.seriesGenres.join('|'),
        'vote_count.gte': 100,
        'vote_average.gte': 6,
      }
      if (config.seriesExcludeGenres?.length) {
        seriesParams.without_genres = config.seriesExcludeGenres.join(',')
      }
      const pages = await Promise.all(PAGES.map((p) => seriesService.discover(p, tmdbLang, seriesParams)))
      return pages.flatMap((r) => r.results)
    },
    staleTime: STALE_TIME,
  })

  return {
    movies: moviesQuery.data ?? [],
    series: seriesQuery.data ?? [],
    isLoading: moviesQuery.isLoading || seriesQuery.isLoading,
  }
}
