'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import MovieCard from '@/features/myList/components/MovieCard'
import SagaCard from '@/features/myList/components/SagaCard'
import RecommendationsDrawer from '@/features/myList/components/RecommendationsDrawer'
import FiltersPanel from '@/components/common/FiltersPanel'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import type { StoredMovie } from '@/store/watchedStore'
import type { FiltersSchema } from '@/types/table'
import {
  RATING_THRESHOLD, INITIAL_FILTERS, groupAndSortMovies, computeSagasFirst, binPackSagas,
  type MyListFilters, type SagaGroup, type RecommendationSource,
} from '../myListUtils'

type Props = {
  recSource: RecommendationSource
  onMovieClick: (id: number) => void
  onShowRec: (movie: StoredMovie) => void
  onSagaRec: (movie: StoredMovie, sagaName: string, groupId: number) => void
  onCloseDrawer: () => void
}

export default function MoviesTabPanel({ recSource, onMovieClick, onShowRec, onSagaRec, onCloseDrawer }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const userId = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')

  const watchedMovies = useWatchedStore((s) => s.movies[userKey])
  const userRatings   = useRatingsStore((s) => s.ratings[userKey])
  const setRatingFn   = useRatingsStore((s) => s.setRating)
  const movieRatings  = useMemo(() => userRatings?.movies ?? {}, [userRatings])

  const [filters, setFilters]       = useState<MyListFilters>(INITIAL_FILTERS)
  const [containerPx, setContainerPx] = useState(1000)
  const containerRef                = useRef<HTMLDivElement>(null)

  const movieList = useMemo(
    () => Object.values(watchedMovies ?? {}).sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0)),
    [watchedMovies],
  )

  const genreOptions = useMemo(() => {
    const seen = new Map<string, number>()
    movieList.forEach((m) => m.genre_ids?.forEach((id) => {
      const name = resolveGenreName(id, language)
      if (name && !seen.has(name)) seen.set(name, id)
    }))
    return [...seen.entries()]
      .map(([label, id]) => ({ value: id, label, icon: getGenreIcon(id) ?? undefined }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [movieList, language])

  const filtersSchema = useMemo<FiltersSchema<MyListFilters>>(() => {
    const schema: FiltersSchema<MyListFilters> = [{ key: 'title', label: 'movies.filters.title', type: 'text', grow: true }]
    if (genreOptions.length > 0) schema.push({ key: 'genre_ids', label: 'movies.filters.genres', type: 'genre-multi', options: genreOptions })
    schema.push({ key: 'min_rating', label: 'movies.filters.ratingGte', type: 'star' })
    return schema
  }, [genreOptions])

  const filteredMovies = useMemo(() => {
    const { title, genre_ids, min_rating } = filters
    const q = title.toLowerCase()
    const selectedNames = genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean)
    return movieList.filter((m) => {
      if (q && !m.title.toLowerCase().includes(q)) return false
      if (min_rating > 0 && (movieRatings[m.id] ?? 0) * 2 < min_rating) return false
      if (selectedNames.length > 0 && m.genre_ids?.length) {
        const names = new Set(m.genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean))
        if (!selectedNames.some((name) => names.has(name))) return false
      }
      return true
    })
  }, [movieList, filters, movieRatings, language])

  const { sagaGroups, standaloneMovies } = useMemo(() => groupAndSortMovies(filteredMovies), [filteredMovies])

  const collectionResults = useQueries({
    queries: sagaGroups.map((g) => ({
      queryKey: ['collection-detail', g.id, language],
      queryFn: () => fetchCollectionDetail(g.id, language),
      staleTime: 24 * 60 * 60 * 1000,
    })),
  })

  const sagaDisplayedCounts = useMemo(() => sagaGroups.map((g, i) => {
    const parts = collectionResults[i]?.data?.parts
    if (!parts?.length) return g.movies.length
    return Math.max(parts.filter((p) => !!p.release_date).length, g.movies.length)
  }), [sagaGroups, collectionResults])

  const { effectiveSagas, effectiveSagaCounts, effectiveStandalones } = useMemo(() => {
    const sagas: SagaGroup[] = []; const counts: number[] = []; const demoted: StoredMovie[] = []
    sagaGroups.forEach((group, i) => {
      const count = sagaDisplayedCounts[i] ?? group.movies.length
      if (count > 1) { sagas.push(group); counts.push(count) }
      else demoted.push(...group.movies)
    })
    const standalones = [...standaloneMovies, ...demoted].sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0))
    return { effectiveSagas: sagas, effectiveSagaCounts: counts, effectiveStandalones: standalones }
  }, [sagaGroups, sagaDisplayedCounts, standaloneMovies])

  const watchedMovieIds = useMemo(() => new Set(movieList.map((m) => m.id)), [movieList])

  const excludeIds = useMemo(() => {
    if (!recSource) return watchedMovieIds
    const sagaIdx = sagaGroups.findIndex((g) => g.id === recSource.scrollId)
    if (sagaIdx === -1) return watchedMovieIds
    const parts = collectionResults[sagaIdx]?.data?.parts ?? []
    return new Set([...watchedMovieIds, ...parts.map((p) => p.id)])
  }, [recSource, watchedMovieIds, sagaGroups, collectionResults])

  const sagasFirst  = useMemo(() => computeSagasFirst(effectiveSagas, effectiveStandalones), [effectiveSagas, effectiveStandalones])
  const packedSagas = useMemo(() => binPackSagas(effectiveSagas, effectiveSagaCounts, containerPx), [effectiveSagas, effectiveSagaCounts, containerPx])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setContainerPx(entry.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!recSource) return
    const scrollId = recSource.scrollId
    const timer = setTimeout(() => {
      const container = containerRef.current
      const el = container?.querySelector(`[data-scroll-id="${scrollId}"]`) as HTMLElement | null
      if (!container || !el) return
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      container.scrollTo({ top: container.scrollTop + elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2, behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [recSource])

  if (movieList.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <Text variant="small" className="text-muted-foreground text-center">{t('myList.emptyMovies')}</Text>
    </div>
  )

  const sagasSection = effectiveSagas.length > 0 && (
    <div className="flex flex-col gap-4 pt-0.5 px-0.5">
      {packedSagas.map((row, rowIdx) => (
        <div key={rowIdx} className="flex flex-wrap gap-4">
          {row.map((group) => (
            <div key={group.id} data-scroll-id={group.id}
              className={`rounded-xl border border-border/40 hc:border-border px-3 pt-3 pb-2 flex flex-col gap-2 h-full bg-cream-100 dark:bg-gray-900 ${group.movies.some((m) => recSource?.id === m.id) ? 'ring-2 ring-primary' : ''}`}
            >
              <SagaCard
                group={group}
                movieRatings={movieRatings}
                userRatings={userRatings?.movies}
                movieRecSource={recSource}
                watchedMovies={watchedMovies}
                onRate={(id, r) => setRatingFn(userKey, 'movie', id, r)}
                onMovieClick={onMovieClick}
                onSagaRec={onSagaRec}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  const standaloneSection = effectiveStandalones.length > 0 && (
    <div className="flex flex-col gap-3">
      {effectiveSagas.length > 0 && (
        <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-muted-foreground mt-2">{t('myList.noSaga')}</Text>
      )}
      <div className="flex flex-wrap gap-4 px-0.5">
        {effectiveStandalones.map((movie, i) => (
          <div key={movie.id} data-scroll-id={movie.id}>
            <MovieCard
              movie={movie}
              rating={userRatings?.movies?.[movie.id] ?? null}
              onRate={(r) => setRatingFn(userKey, 'movie', movie.id, r)}
              onClick={() => onMovieClick(movie.id)}
              eager={i < 6}
              onShowRecommendations={(movieRatings[movie.id] ?? 0) >= RATING_THRESHOLD ? () => onShowRec(movie) : undefined}
              isRecommendationSource={recSource?.id === movie.id}
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <FiltersPanel schema={filtersSchema} filters={filters} onChange={setFilters} />
      </div>
      {filteredMovies.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Text variant="small" className="text-muted-foreground text-center">{t('myList.filters.noResults')}</Text>
        </div>
      ) : (
        <div className="flex-1 flex gap-0 min-h-0 animate-fade-in">
          <div ref={containerRef} className="flex-1 overflow-y-auto space-y-6 min-w-0">
            {sagasFirst ? <>{sagasSection}{standaloneSection}</> : <>{standaloneSection}{sagasSection}</>}
          </div>
          {recSource && (
            <RecommendationsDrawer
              type="movie"
              sourceId={recSource.id}
              sourceName={recSource.name}
              sourcePosterPath={recSource.posterPath}
              watchedIds={excludeIds}
              onSelect={onMovieClick}
              onClose={onCloseDrawer}
            />
          )}
        </div>
      )}
    </div>
  )
}
