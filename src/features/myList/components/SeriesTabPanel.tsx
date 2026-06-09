'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import SeriesCard from '@/features/myList/components/SeriesCard'
import RecommendationsDrawer from '@/features/myList/components/RecommendationsDrawer'
import FiltersPanel from '@/components/common/FiltersPanel'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useUserStore } from '@/store/userStore'
import { useLanguageStore } from '@/store/languageStore'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import type { StoredSeries } from '@/store/watchedStore'
import type { FiltersSchema } from '@/types/table'
import { RATING_THRESHOLD, INITIAL_FILTERS, type MyListFilters, type RecommendationSource } from '../myListUtils'

type Props = {
  recSource: RecommendationSource
  onSeriesClick: (id: number) => void
  onShowRec: (series: StoredSeries) => void
  onCloseDrawer: () => void
}

export default function SeriesTabPanel({ recSource, onSeriesClick, onShowRec, onCloseDrawer }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const userId = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')

  const watchedSeries   = useWatchedStore((s) => s.seriesData[userKey])
  const watchedEpisodes = useWatchedStore((s) => s.episodes[userKey])
  const userRatings     = useRatingsStore((s) => s.ratings[userKey])
  const setRatingFn     = useRatingsStore((s) => s.setRating)
  const seriesRatings   = useMemo(() => userRatings?.series ?? {}, [userRatings])

  const [filters, setFilters] = useState<MyListFilters>(INITIAL_FILTERS)
  const scrollRef             = useRef<HTMLDivElement>(null)

  const seriesList = useMemo(
    () => Object.values(watchedSeries ?? {})
      .filter((s) => Object.keys(watchedEpisodes?.[s.id] ?? {}).length > 0)
      .sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0)),
    [watchedSeries, watchedEpisodes],
  )

  const genreOptions = useMemo(() => {
    const seen = new Map<string, number>()
    seriesList.forEach((s) => s.genre_ids?.forEach((id) => {
      const name = resolveGenreName(id, language)
      if (name && !seen.has(name)) seen.set(name, id)
    }))
    return [...seen.entries()]
      .map(([label, id]) => ({ value: id, label, icon: getGenreIcon(id) ?? undefined }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [seriesList, language])

  const filtersSchema = useMemo<FiltersSchema<MyListFilters>>(() => {
    const schema: FiltersSchema<MyListFilters> = [{ key: 'title', label: 'movies.filters.title', type: 'text', grow: true }]
    if (genreOptions.length > 0) schema.push({ key: 'genre_ids', label: 'movies.filters.genres', type: 'genre-multi', options: genreOptions })
    schema.push({ key: 'min_rating', label: 'movies.filters.ratingGte', type: 'star' })
    return schema
  }, [genreOptions])

  const filteredSeries = useMemo(() => {
    const { title, genre_ids, min_rating } = filters
    const q = title.toLowerCase()
    const selectedNames = genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean)
    return seriesList.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false
      if (min_rating > 0 && (seriesRatings[s.id] ?? 0) * 2 < min_rating) return false
      if (selectedNames.length > 0 && s.genre_ids?.length) {
        const names = new Set(s.genre_ids.map((id) => resolveGenreName(id, language)).filter(Boolean))
        if (!selectedNames.some((name) => names.has(name))) return false
      }
      return true
    })
  }, [seriesList, filters, seriesRatings, language])

  const seriesEpCounts = useMemo(
    () => new Map(seriesList.map((s) => [s.id, Object.keys(watchedEpisodes?.[s.id] ?? {}).length])),
    [seriesList, watchedEpisodes],
  )

  const watchedSeriesIds = useMemo(() => new Set(seriesList.map((s) => s.id)), [seriesList])

  useEffect(() => {
    if (!recSource) return
    const scrollId = recSource.scrollId
    const frame = requestAnimationFrame(() => {
      const container = scrollRef.current
      const el = container?.querySelector(`[data-scroll-id="${scrollId}"]`) as HTMLElement | null
      if (!container || !el) return
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      container.scrollTo({ top: container.scrollTop + elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [recSource])

  if (seriesList.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <Text variant="small" className="text-muted-foreground text-center">{t('myList.emptySeries')}</Text>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <FiltersPanel schema={filtersSchema} filters={filters} onChange={setFilters} />
      </div>
      {filteredSeries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Text variant="small" className="text-muted-foreground text-center">{t('myList.filters.noResults')}</Text>
        </div>
      ) : (
        <div className="flex-1 flex gap-0 min-h-0 animate-fade-in">
          <div ref={scrollRef} className="flex-1 overflow-y-auto min-w-0">
            <div className="flex flex-wrap gap-4 pt-0.5 px-0.5">
              {filteredSeries.map((series, i) => (
                <div key={series.id} data-scroll-id={series.id}>
                  <SeriesCard
                    series={series}
                    watchedEpisodes={seriesEpCounts.get(series.id) ?? 0}
                    rating={userRatings?.series?.[series.id] ?? null}
                    onRate={(r) => setRatingFn(userKey, 'series', series.id, r)}
                    onClick={() => onSeriesClick(series.id)}
                    eager={i < 6}
                    onShowRecommendations={(seriesRatings[series.id] ?? 0) >= RATING_THRESHOLD ? () => onShowRec(series) : undefined}
                    isRecommendationSource={recSource?.id === series.id}
                  />
                </div>
              ))}
            </div>
          </div>
          {recSource && (
            <RecommendationsDrawer
              type="series"
              sourceId={recSource.id}
              sourceName={recSource.name}
              sourcePosterPath={recSource.posterPath}
              watchedIds={watchedSeriesIds}
              onSelect={onSeriesClick}
              onClose={onCloseDrawer}
            />
          )}
        </div>
      )}
    </div>
  )
}
