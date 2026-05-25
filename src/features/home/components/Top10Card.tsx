'use client'

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import ContentTabToggle, { type ContentTab } from '@/components/ui/ContentTabToggle'
import Text from '@/components/ui/Text'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import MediaPoster from '@/components/common/MediaPoster'
import { useLanguageStore } from '@/store/languageStore'
import { TMDB_LANGUAGE } from '@/config/tmdb'
import { resolveGenreName, MOVIE_GENRE_IDS, SERIES_GENRE_IDS } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
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
  if (mode === 'user' && item.personalRating !== null) {
    return (
      <span className="text-xs font-semibold text-yellow-500 dark:text-yellow-300 shrink-0 tabular-nums">
        ★ {(item.personalRating * 2).toFixed(1)}
      </span>
    )
  }
  return (
    <span className={`text-xs font-semibold shrink-0 tabular-nums ${
      mode === 'user' ? 'text-muted-foreground/40' : 'text-yellow-500 dark:text-yellow-300'
    }`}>
      ★ {item.tmdbScore.toFixed(1)}
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
  className = '',
}: Props) {
  const { t } = useTranslation()
  const { language } = useLanguageStore()
  const tmdbLang = TMDB_LANGUAGE[language] ?? 'es-ES'
  const [mode, setMode] = useState<'user' | 'global'>(showUserToggle ? defaultMode : 'global')
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)
  const [isGenreOpen, setIsGenreOpen] = useState(false)
  const genreRef = useRef<HTMLDivElement>(null)
  const genreTriggerRef = useRef<HTMLButtonElement>(null)
  const genreDropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const isMovies = tab === 'movies'
  const globalQuery   = isMovies ? globalMovieQuery : globalSeriesQuery
  const userBaseItems = isMovies ? userMovieItems   : userSeriesItems

  const handleTabChange = useCallback((newTab: ContentTab) => {
    onTabChange(newTab)
    setSelectedGenreId(null)
    setIsGenreOpen(false)
  }, [onTabChange])

  const handleModeChange = useCallback((next: 'user' | 'global') => {
    setMode(next)
    setSelectedGenreId(null)
    setIsGenreOpen(false)
  }, [])

  // Base top 10 (no genre filter)
  const baseItems   = mode === 'user' ? userBaseItems : (globalQuery.data ?? [])
  const baseLoading = mode === 'global' && globalQuery.isLoading
  const baseError   = mode === 'global' && globalQuery.isError

  // Genre-specific queries — enabled only when a genre is selected and the tab matches
  const genreMovieQuery      = useGlobalMovieTop10ByGenre(
    tmdbLang,
    mode === 'global' && isMovies ? selectedGenreId : null
  )
  const genreSeriesQuery     = useGlobalSeriesTop10ByGenre(
    tmdbLang,
    mode === 'global' && !isMovies ? selectedGenreId : null
  )
  const userGenreMovieQuery  = useUserMovieTop10ByGenre(
    mode === 'user' && isMovies  ? userMoviePool  : [],
    mode === 'user' && isMovies  ? selectedGenreId : null,
    tmdbLang
  )
  const userGenreSeriesQuery = useUserSeriesTop10ByGenre(
    mode === 'user' && !isMovies ? userSeriesPool : [],
    mode === 'user' && !isMovies ? selectedGenreId : null,
    tmdbLang
  )

  const activeGenreQuery = mode === 'user'
    ? (isMovies ? userGenreMovieQuery : userGenreSeriesQuery)
    : (isMovies ? genreMovieQuery     : genreSeriesQuery)

  // Resolved display values
  const items = selectedGenreId !== null
    ? (activeGenreQuery.data ?? [])
    : baseItems

  const loading = selectedGenreId !== null
    ? activeGenreQuery.isLoading
    : baseLoading

  const error = selectedGenreId !== null
    ? activeGenreQuery.isError
    : baseError

  // All genre IDs for the current tab
  const genreIds = (isMovies ? MOVIE_GENRE_IDS : SERIES_GENRE_IDS).filter((id) => id !== 10770)

  const openDropdown = useCallback(() => {
    const rect = genreTriggerRef.current?.getBoundingClientRect()
    if (rect) setDropdownStyle({ top: rect.bottom + 4, left: rect.left })
    setIsGenreOpen(true)
  }, [])

  useLayoutEffect(() => {
    if (!isGenreOpen || !genreDropdownRef.current || !genreTriggerRef.current) return
    const drop = genreDropdownRef.current.getBoundingClientRect()
    const trigger = genreTriggerRef.current.getBoundingClientRect()
    let { top, left } = dropdownStyle as { top: number; left: number }
    if (drop.bottom > window.innerHeight) top = trigger.top - drop.height - 4
    if (drop.right > window.innerWidth) left = window.innerWidth - drop.width - 8
    if (top !== (dropdownStyle as { top: number }).top || left !== (dropdownStyle as { left: number }).left) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDropdownStyle({ top, left })
    }
  }, [isGenreOpen, dropdownStyle])

  useEffect(() => {
    if (!isGenreOpen) return
    function handleOutside(e: MouseEvent) {
      if (
        !genreTriggerRef.current?.contains(e.target as Node) &&
        !genreDropdownRef.current?.contains(e.target as Node)
      ) setIsGenreOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isGenreOpen])

  const empty = !loading && !error && items.length === 0

  const activeGenreName = selectedGenreId !== null
    ? resolveGenreName(selectedGenreId, language)
    : t('dashboard.top10.allGenres')

  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-3 select-none${className ? ` ${className}` : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Text variant="body" className="font-semibold text-foreground">
            {t('dashboard.top10.title')}
          </Text>
          <ContentTabToggle tab={tab} onTabChange={handleTabChange} />
        </div>
        <div className="flex items-center gap-2">
          {/* Genre picker */}
          <div ref={genreRef}>
            <button
              ref={genreTriggerRef}
              type="button"
              onClick={() => isGenreOpen ? setIsGenreOpen(false) : openDropdown()}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                selectedGenreId !== null
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted text-foreground hover:bg-muted/60'
              }`}
            >
              {[selectedGenreId].map((id) => {
                if (id === null) return <LayoutGrid key="default" size={12} className="shrink-0" />
                const Icon = getGenreIcon(id)
                return Icon ? <Icon key={id} size={12} className="shrink-0" /> : <LayoutGrid key="default" size={12} className="shrink-0" />
              })}
              <span className="max-w-35 truncate">{activeGenreName}</span>
              <ChevronDown
                size={11}
                className={`shrink-0 transition-transform duration-150 ${isGenreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isGenreOpen && typeof window !== 'undefined' && createPortal(
              <div
                ref={genreDropdownRef}
                data-cy="top10-genre-dropdown"
                className="animate-fade-in fixed z-9999 rounded-xl border border-border bg-card shadow-lg p-2 w-64"
                style={dropdownStyle}
              >
                <button
                  type="button"
                  onClick={() => { setSelectedGenreId(null); setIsGenreOpen(false) }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium mb-1 transition-colors ${
                    selectedGenreId === null
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <LayoutGrid size={12} className="shrink-0" />
                  {t('dashboard.top10.allGenres')}
                </button>

                <div className="grid grid-cols-2 gap-0.5">
                  {genreIds.map((id) => {
                    const Icon = getGenreIcon(id)
                    const name = resolveGenreName(id, language)
                    const isSelected = selectedGenreId === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setSelectedGenreId(id); setIsGenreOpen(false) }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted/60'
                        }`}
                      >
                        {Icon && <Icon size={12} className="shrink-0" />}
                        <span className="truncate">{name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>,
              document.body,
            )}
          </div>

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
            <ol className="flex flex-col gap-0.5">
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(isMovies ? 'movie' : 'series', item.id)}
                    className="w-full flex items-center gap-2.5 py-1 rounded-lg px-1 hover:bg-muted/60 transition-colors group text-left cursor-pointer"
                  >
                    <span className="w-5 text-center text-xs font-semibold text-muted-foreground shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    <MediaPoster
                      posterPath={item.posterPath}
                      title={item.title}
                      variant="sm"
                      loading={i < 3 ? 'eager' : 'lazy'}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <span className="flex items-center gap-1 mt-0.5">
                        {item.year && (
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {item.year}
                          </span>
                        )}
                        {item.year && item.genre_ids.length > 0 && (
                          <span className="text-muted-foreground/40 text-[10px] shrink-0">·</span>
                        )}
                        {Array.from(
                          new Map(
                            item.genre_ids
                              .map((gid) => [getGenreIcon(gid), gid] as const)
                              .filter(([Icon]) => Icon !== null)
                          ).entries()
                        ).slice(0, 3).map(([Icon, gid]) =>
                          Icon ? (
                            <Icon key={gid} size={10} className="text-muted-foreground shrink-0" />
                          ) : null
                        )}
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
