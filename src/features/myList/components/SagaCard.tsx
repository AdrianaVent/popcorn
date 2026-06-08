'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import type { StoredMovie } from '@/store/watchedStore'
import type { Rating } from '@/store/ratingsStore'
import type { TMDBCollectionPart } from '@/types/tmdb'
import Text from '@/components/ui/Text'
import Tooltip from '@/components/ui/Tooltip'
import MovieCard from '@/features/myList/components/MovieCard'
import UnwatchedMoviePlaceholder from '@/features/myList/components/UnwatchedMoviePlaceholder'
import { type SagaGroup, type RecommendationSource, RATING_THRESHOLD, formatSagaName } from '@/features/myList/myListUtils'

export default function SagaCard({
  group,
  movieRatings,
  userRatings,
  movieRecSource,
  watchedMovies,
  onRate,
  onMovieClick,
  onSagaRec,
}: {
  group: SagaGroup
  movieRatings: Record<number, Rating>
  userRatings: Record<number, Rating> | undefined
  movieRecSource: RecommendationSource
  watchedMovies: Record<number, StoredMovie> | undefined
  onRate: (id: number, r: Rating) => void
  onMovieClick: (id: number) => void
  onSagaRec: (movie: StoredMovie, sagaName: string, groupId: number) => void
}) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()

  const { data: collection } = useQuery({
    queryKey: ['collection-detail', group.id, language],
    queryFn: () => fetchCollectionDetail(group.id, language),
    staleTime: 24 * 60 * 60 * 1000,
  })

  // Uses the full watchedMovies store (not group.movies) so watched movies filtered out by
  // min_rating still appear as MovieCard instead of UnwatchedMoviePlaceholder.
  const allMovies = useMemo(() => {
    if (!collection?.parts?.length) {
      return group.movies.map((m) => ({ part: null as TMDBCollectionPart | null, watched: m }))
    }
    return [...collection.parts]
      .filter((p) => !!p.release_date)
      .sort((a, b) => a.release_date.localeCompare(b.release_date))
      .map((part) => ({ part, watched: watchedMovies?.[part.id] ?? null }))
  }, [collection, group.movies, watchedMovies])

  const bestRatedMovie = useMemo(() =>
    group.movies.reduce<StoredMovie | null>((best, movie) => {
      const r = movieRatings[movie.id] ?? 0
      const bestR = best ? (movieRatings[best.id] ?? 0) : 0
      return r >= RATING_THRESHOLD && r > bestR ? movie : best
    }, null),
    [group.movies, movieRatings],
  )

  const sagaRecActive = bestRatedMovie !== null && movieRecSource?.id === bestRatedMovie.id

  return (
    <>
      <div className="flex justify-center text-center">
        <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-foreground">{formatSagaName(group.name)}</Text>
      </div>

      <div className="flex flex-wrap gap-3">
        {allMovies.map(({ part, watched }, i) =>
          watched ? (
            <MovieCard
              key={watched.id}
              movie={watched}
              rating={userRatings?.[watched.id] ?? null}
              onRate={(r) => onRate(watched.id, r)}
              onClick={() => onMovieClick(watched.id)}
              eager={i < 6}
              showRecommendations={false}
            />
          ) : (
            <UnwatchedMoviePlaceholder
              key={part!.id}
              part={part!}
              onClick={() => onMovieClick(part!.id)}
            />
          )
        )}
      </div>

      <div className="flex justify-center mt-auto pt-1">
        <Tooltip content={t('myList.recommendations.rateFirst')} disabled={!!bestRatedMovie} placement="bottom">
          <button
            aria-label={`${t('myList.recommendations.similar')}: ${formatSagaName(group.name)}`}
            onClick={bestRatedMovie ? () => onSagaRec(bestRatedMovie, formatSagaName(group.name), group.id) : undefined}
            disabled={!bestRatedMovie}
            className={`text-[11px] px-3 py-1 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed ${
              sagaRecActive
                ? 'border-primary text-primary bg-primary/10 hc:bg-primary hc:text-primary-foreground'
                : bestRatedMovie
                  ? 'border-primary/40 text-primary/80 hover:border-primary hover:bg-primary/5 hc:border-primary hc:text-primary hc:hover:bg-muted'
                  : 'border-border/40 text-muted-foreground/30 hc:border-border hc:text-muted-foreground'
            }`}
          >
            {t('myList.recommendations.similar')}
          </button>
        </Tooltip>
      </div>
    </>
  )
}
