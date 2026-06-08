'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLanguageStore } from '@/store/languageStore'
import { fetchCollectionDetail } from '@/features/movies/movies.service'
import type { StoredMovie } from '@/store/watchedStore'
import type { WatchlistMovie } from '@/store/watchlistStore'
import Text from '@/components/ui/Text'
import WatchlistCard from '@/features/myList/components/WatchlistCard'
import UnwatchedMoviePlaceholder from '@/features/myList/components/UnwatchedMoviePlaceholder'
import { getTMDBImageUrl } from '@/utils/tmdb'
import { type WatchlistSagaGroup, formatSagaName } from '@/features/myList/myListUtils'

export default function WatchlistSagaCard({
  group,
  watchedMovies,
  watchlistMoviesMap,
  onMovieClick,
  onRemove,
}: {
  group: WatchlistSagaGroup
  watchedMovies: Record<number, StoredMovie> | undefined
  watchlistMoviesMap: Record<number, WatchlistMovie> | undefined
  onMovieClick: (id: number) => void
  onRemove: (movieId: number) => void
}) {
  const { language } = useLanguageStore()

  const { data: collection } = useQuery({
    queryKey: ['collection-detail', group.id, language],
    queryFn: () => fetchCollectionDetail(group.id, language),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const allMovies = useMemo(() => {
    type PartMin = { id: number; title: string; poster_path: string | null; release_date: string }
    const parts: PartMin[] = collection?.parts?.length ? collection.parts : group.movies
    const today = new Date().toISOString().slice(0, 10)
    return [...parts]
      .filter((p) => !!p.release_date && p.release_date <= today)
      .sort((a, b) => a.release_date.localeCompare(b.release_date))
      .map((part) => ({
        part,
        isWatched:     !!watchedMovies?.[part.id],
        isInWatchlist: !!watchlistMoviesMap?.[part.id],
      }))
  }, [collection, group.movies, watchedMovies, watchlistMoviesMap])

  return (
    <div className="rounded-xl border border-border/40 hc:border-border px-3 pt-3 pb-2 flex flex-col gap-2 bg-cream-100 dark:bg-gray-900">
      <div className="flex justify-center text-center">
        <Text variant="caption" className="font-semibold uppercase tracking-[0.14em] text-foreground">
          {formatSagaName(group.name)}
        </Text>
      </div>
      <div className="flex flex-wrap gap-3">
        {allMovies.map(({ part, isWatched, isInWatchlist }, i) => {
          if (isWatched) {
            return (
              <button key={part.id} onClick={() => onMovieClick(part.id)} aria-label={part.title} className="flex flex-col gap-2 w-24 items-center group">
                <div className="relative w-24 aspect-2/3 rounded-lg overflow-hidden">
                  {part.poster_path ? (
                    <Image
                      fill
                      src={getTMDBImageUrl(part.poster_path, 'w185')!}
                      alt=""
                      className="object-cover opacity-40 hc:opacity-70 group-hover:opacity-50 hc:group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted opacity-40 hc:opacity-70" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4l3 3L9 1" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/50 hc:text-muted-foreground text-center truncate w-full px-0.5 leading-tight" aria-hidden="true">{part.title}</p>
              </button>
            )
          }
          if (isInWatchlist) {
            return (
              <WatchlistCard
                key={part.id}
                posterPath={part.poster_path}
                title={part.title}
                year={part.release_date ? new Date(part.release_date).getFullYear() : null}
                onClick={() => onMovieClick(part.id)}
                onRemove={() => onRemove(part.id)}
                eager={i < 6}
              />
            )
          }
          return (
            <UnwatchedMoviePlaceholder key={part.id} part={part} onClick={() => onMovieClick(part.id)} />
          )
        })}
      </div>
    </div>
  )
}
