'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import ContentTabToggle, { type ContentTab } from '@/components/ui/ContentTabToggle'
import Text from '@/components/ui/Text'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import MediaPoster from '@/components/common/MediaPoster'
import { useLanguageStore } from '@/store/languageStore'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { MOVIE_GENRE_IDS, SERIES_GENRE_IDS } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import GenreDropdown from './GenreDropdown'
import {
  useGlobalMovieTop10ByGenre,
  useGlobalSeriesTop10ByGenre,
  useUserMovieTop10ByGenre,
  useUserSeriesTop10ByGenre,
  type Top10Item,
} from '@/features/home/hooks/useTop10'

type Props = {
  tab: ContentTab
  onTabChange: (tab: ContentTab) => void
  globalMovieQuery: { data?: Top10Item[]; isLoading: boolean; isError: boolean }
  globalSeriesQuery: { data?: Top10Item[]; isLoading: boolean; isError: boolean }
  userMovieItems: Top10Item[]
  userSeriesItems: Top10Item[]
  userMoviePool: Top10Item[]
  userSeriesPool: Top10Item[]
  defaultMode?: 'user' | 'global'
  showUserToggle?: boolean
  onItemClick: (type: 'movie' | 'series', id: number) => void
  className?: string
}

function ItemSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="w-5 h-3 rounded animate-pulse bg-border shrink-0" />
      <div className="w-9 h-14 rounded animate-pulse bg-border shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-2.5 rounded animate-pulse bg-border w-4/5" />
        <div className="h-2 rounded animate-pulse bg-border w-2/5" />
      </div>
      <div className="w-8 h-3 rounded animate-pulse bg-border shrink-0" />
    </div>
  )
}

function ItemScore({ item, mode }: { item: Top10Item; mode: 'user' | 'global' }) {
  const hasPersonal = mode === 'user' && item.personalRating !== null
  const score = hasPersonal ? (item.personalRating! * 2).toFixed(1) : item.tmdbScore.toFixed(1)
  return (
    <span
      aria-label={`${score} / 10`}
      className={clsx(
        'text-xs font-semibold shrink-0 tabular-nums',
        hasPersonal || mode === 'global'
          ? 'text-yellow-500 dark:text-yellow-300 hc:text-amber-700'
          : 'text-muted-foreground/40 hc:text-muted-foreground',
      )}
    >
      <span aria-hidden="true">★ </span>{score}
    </span>
  )
}

export default function Top10Card({
  tab,
  onTabChange,
  globalMovieQuery,
  globalSeriesQuery,
  userMovieItems,
  userSeriesItems,
  userMoviePool,
  userSeriesPool,
  defaultMode = 'global',
  showUserToggle = true,
  onItemClick,
  className,
}: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'
  const [mode, setMode]                   = useState<'user' | 'global'>(showUserToggle ? defaultMode : 'global')
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)

  const isMovies = tab === 'movies'

  const handleTabChange = useCallback((newTab: ContentTab) => {
    onTabChange(newTab)
    setSelectedGenreId(null)
  }, [onTabChange])

  const handleModeChange = useCallback((next: 'user' | 'global') => {
    setMode(next)
    setSelectedGenreId(null)
  }, [])

  const globalQuery   = isMovies ? globalMovieQuery : globalSeriesQuery
  const userBaseItems = isMovies ? userMovieItems   : userSeriesItems
  const baseItems     = mode === 'user' ? userBaseItems : (globalQuery.data ?? [])
  const baseLoading   = mode === 'global' && globalQuery.isLoading
  const baseError     = mode === 'global' && globalQuery.isError

  const genreMovieQuery      = useGlobalMovieTop10ByGenre(tmdbLang, mode === 'global' && isMovies ? selectedGenreId : null)
  const genreSeriesQuery     = useGlobalSeriesTop10ByGenre(tmdbLang, mode === 'global' && !isMovies ? selectedGenreId : null)
  const userGenreMovieQuery  = useUserMovieTop10ByGenre(mode === 'user' && isMovies ? userMoviePool : [], mode === 'user' && isMovies ? selectedGenreId : null, tmdbLang)
  const userGenreSeriesQuery = useUserSeriesTop10ByGenre(mode === 'user' && !isMovies ? userSeriesPool : [], mode === 'user' && !isMovies ? selectedGenreId : null, tmdbLang)

  const activeGenreQuery = mode === 'user'
    ? (isMovies ? userGenreMovieQuery : userGenreSeriesQuery)
    : (isMovies ? genreMovieQuery     : genreSeriesQuery)

  const items   = selectedGenreId !== null ? (activeGenreQuery.data ?? []) : baseItems
  const loading = selectedGenreId !== null ? activeGenreQuery.isLoading    : baseLoading
  const error   = selectedGenreId !== null ? activeGenreQuery.isError      : baseError
  const empty   = !loading && !error && items.length === 0

  const genreIds = (isMovies ? MOVIE_GENRE_IDS : SERIES_GENRE_IDS).filter((id) => id !== 10770)

  return (
    <div className={clsx('flex flex-col gap-2 rounded-xl border border-border bg-card p-3 select-none', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Text variant="body" className="font-semibold text-foreground">{t('dashboard.top10.title')}</Text>
          <ContentTabToggle tab={tab} onTabChange={handleTabChange} />
        </div>
        <div className="flex items-center gap-2">
          <GenreDropdown
            genreIds={genreIds}
            selectedGenreId={selectedGenreId}
            onSelect={setSelectedGenreId}
            language={language}
          />
          {showUserToggle && (
            <ToggleSwitch
              options={[
                { value: 'user',   label: t('dashboard.mode.user') },
                { value: 'global', label: t('dashboard.mode.global') },
              ]}
              value={mode}
              onChange={handleModeChange}
            />
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {loading && (
          <div key={`${tab}-${mode}-${selectedGenreId}`} className="absolute inset-0 overflow-y-auto animate-fade-in">
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => <ItemSkeleton key={i} />)}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Text variant="small" className="text-muted-foreground">{t('dashboard.chart.error')}</Text>
          </div>
        )}

        {empty && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-4">
            <Text variant="small" className="text-muted-foreground">
              {mode === 'user' ? t('dashboard.top10.empty') : t('dashboard.chart.error')}
            </Text>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div key={`${tab}-${mode}-${selectedGenreId}`} className="absolute inset-0 overflow-y-auto animate-fade-in">
            <ol className="flex flex-col gap-0.5" aria-label={t('dashboard.top10.title')}>
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(isMovies ? 'movie' : 'series', item.id)}
                    className="w-full flex items-center gap-2.5 py-1 rounded-lg px-1 hover:bg-muted/60 hc:hover:bg-muted transition-colors group text-left cursor-pointer"
                  >
                    <span className="w-5 text-center text-xs font-semibold text-muted-foreground shrink-0 tabular-nums">{i + 1}</span>
                    <MediaPoster posterPath={item.posterPath} title={item.title} variant="sm" loading={i < 3 ? 'eager' : 'lazy'} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <span className="flex items-center gap-1 mt-0.5">
                        {item.year && <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{item.year}</span>}
                        {item.year && item.genre_ids.length > 0 && (
                          <span aria-hidden="true" className="text-muted-foreground/40 hc:text-muted-foreground text-[10px] shrink-0">·</span>
                        )}
                        {Array.from(new Map(item.genre_ids.map((gid) => [getGenreIcon(gid), gid] as const).filter(([I]) => I !== null)).entries())
                          .slice(0, 3)
                          .map(([Icon, gid]) => Icon ? <span key={gid} aria-hidden="true"><Icon size={10} className="text-muted-foreground shrink-0" /></span> : null)}
                      </span>
                    </span>
                    <ItemScore item={item} mode={mode} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
