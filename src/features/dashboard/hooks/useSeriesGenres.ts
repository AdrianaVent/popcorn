import { useQuery } from '@tanstack/react-query'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { seriesService } from '@/services/tmdb/series'
import { genresService } from '@/services/tmdb/genres'
import { resolveSeriesGenreName } from '@/features/series/getSeriesUI'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { buildGenreCounts } from './buildGenreCounts'
import type { GenreEntry } from './useMovieGenres'

const GLOBAL_PAGES = 5

export function useUserSeriesGenres() {
  const userId = useUserStore((s) => s.userId) ?? ''
  const language = useLanguageStore((s) => s.language)
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'en-US'
  const watchedSeries = useWatchedStore((s) => s.seriesData[userId])
  const watchedIds = Object.keys(watchedSeries ?? {}).map(Number)

  return useQuery<GenreEntry[]>({
    queryKey: ['user-series-genres', userId, watchedIds.slice().sort(), tmdbLang],
    queryFn: async () => {
      const results = await Promise.allSettled(
        watchedIds.map((id) => seriesService.detail(id, tmdbLang))
      )
      return buildGenreCounts(
        results.flatMap((r) =>
          r.status === 'fulfilled'
            ? [r.value.genres?.map((g) => ({ name: resolveSeriesGenreName(g.id, g.name, language) })) ?? []]
            : []
        )
      )
    },
    enabled: watchedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGlobalSeriesGenres() {
  const language = useLanguageStore((s) => s.language)
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'en-US'

  return useQuery<GenreEntry[]>({
    queryKey: ['global-series-genres', tmdbLang],
    queryFn: async () => {
      const [genreList, ...pages] = await Promise.all([
        genresService.seriesList(tmdbLang),
        ...Array.from({ length: GLOBAL_PAGES }, (_, i) =>
          seriesService.discover(i + 1, tmdbLang)
        ),
      ])
      const genreMap = Object.fromEntries(
        genreList.genres.map((g) => [g.id, resolveSeriesGenreName(g.id, g.name, language)])
      )
      return buildGenreCounts(
        pages.flatMap((page) =>
          page.results.map((series) =>
            series.genre_ids.flatMap((id) => (genreMap[id] ? [{ name: genreMap[id] }] : []))
          )
        )
      )
    },
    staleTime: Infinity,
  })
}
