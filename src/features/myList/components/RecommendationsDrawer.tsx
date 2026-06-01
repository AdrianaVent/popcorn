'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { fetchMovieRecommendations } from '@/features/movies/movies.service'
import { fetchSeriesRecommendations } from '@/features/series/series.service'
import MediaPoster from '@/components/common/MediaPoster'
import { XIcon } from '@/components/icons'
import type { TMDBMovie, TMDBSeries, TMDBPagedResponse } from '@/types/tmdb'

type RecommendationItem = TMDBMovie | TMDBSeries

type Props = {
  type: 'movie' | 'series'
  sourceId: number
  sourceName: string
  sourcePosterPath: string | null
  watchedIds: Set<number>
  onSelect: (id: number) => void
  onClose: () => void
}

export default function RecommendationsDrawer({ type, sourceId, sourceName, sourcePosterPath, watchedIds, onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()

  const { data, isLoading } = useQuery<TMDBPagedResponse<RecommendationItem>>({
    queryKey: [type === 'movie' ? 'movie-recommendations' : 'series-recommendations', sourceId, language],
    queryFn: () =>
      type === 'movie'
        ? fetchMovieRecommendations(sourceId, language) as Promise<TMDBPagedResponse<RecommendationItem>>
        : fetchSeriesRecommendations(sourceId, language) as Promise<TMDBPagedResponse<RecommendationItem>>,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const items = (data?.results ?? [])
    .filter((item) => !watchedIds.has(item.id))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      posterPath: item.poster_path,
      title: 'title' in item ? (item as TMDBMovie).title : (item as TMDBSeries).name,
      year: ('title' in item ? (item as TMDBMovie).release_date : (item as TMDBSeries).first_air_date)?.slice(0, 4) ?? '',
    }))

  if (!isLoading && items.length === 0) return null

  return (
    <div data-cy="recommendations-drawer" className="w-56 shrink-0 flex flex-col gap-3 animate-fade-in bg-cream-400 dark:bg-gray-700/70 rounded-xl p-4 ml-4">

      {/* Source header */}
      <div className="flex items-start gap-2.5">
        <MediaPoster posterPath={sourcePosterPath} title={sourceName} variant="sm" loading="eager" />
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
            {t('myList.recommendations.title')}
          </p>
          <p className="text-[12px] font-semibold text-foreground leading-snug line-clamp-3">{sourceName}</p>
        </div>
        <button
          data-cy="drawer-close"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
        >
          <XIcon size={13} />
        </button>
      </div>

      <div className="h-px bg-border/40 shrink-0" />

      {/* List */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2.5 items-center p-1">
                <div className="w-14 h-20 rounded bg-border/50 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-border/50 rounded animate-pulse" />
                  <div className="h-3 bg-border/50 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 w-8 bg-border/30 rounded animate-pulse" />
                </div>
              </div>
            ))
          : items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="flex gap-2.5 items-center p-1 rounded-lg hover:bg-muted/60 transition-colors text-left group"
              >
                <MediaPoster posterPath={item.posterPath} title={item.title} variant="list" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  {item.year && <p className="text-[10px] text-muted-foreground mt-0.5">{item.year}</p>}
                </div>
              </button>
            ))
        }
      </div>
    </div>
  )
}
