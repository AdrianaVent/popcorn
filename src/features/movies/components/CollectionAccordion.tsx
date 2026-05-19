import { useTranslation } from 'react-i18next'
import AccordionList from '@/components/ui/AccordionList'
import MediaPoster from '@/components/common/MediaPoster'
import Text from '@/components/ui/Text'
import clsx from 'clsx'
import { useCollectionDetail } from '@/features/movies/hooks/useCollectionDetail'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { EyeIcon } from '@/components/icons'
import type { TMDBCollection } from '@/types/tmdb'

type Props = {
  collection: TMDBCollection
  movieId: number
  onMovieSelect?: (id: number) => void
}

export default function CollectionAccordion({ collection, movieId, onMovieSelect }: Props) {
  const { t } = useTranslation()
  const { detail, loading } = useCollectionDetail(collection.id, true)
  const userId = useUserStore((s) => s.userId)
  const role   = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])
  const toggleMovie   = useWatchedStore((s) => s.toggleMovie)

  const parts =
    detail?.parts
      ?.filter((p) => !!p.release_date)
      .slice()
      .sort((a, b) => a.release_date.localeCompare(b.release_date)) ?? []

  const today = new Date().toISOString().slice(0, 10)
  const releasedParts = parts.filter((p) => p.release_date && p.release_date <= today)
  const allReleasedWatched = releasedParts.length > 0 && releasedParts.every((p) => !!watchedMovies?.[p.id])

  const handleMarkSaga = () => {
    const toToggle = allReleasedWatched
      ? releasedParts
      : releasedParts.filter((p) => !watchedMovies?.[p.id])
    toToggle.forEach((p) => toggleMovie(userKey, {
      id: p.id,
      title: p.title,
      release_date: p.release_date,
      vote_average: p.vote_average,
      vote_count: 0,
      poster_path: p.poster_path,
      original_language: '',
      collection_id: collection.id,
      collection_name: collection.name,
    }))
  }

  return (
    <AccordionList
      title={
        <div className="flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground">
            {t('movies.detail.collection')}
          </Text>
          <Text variant="small" className="text-foreground font-medium truncate">
            {collection.name}
          </Text>
        </div>
      }
      actions={role !== 'admin' && releasedParts.length > 0 ? (
        <button
          onClick={handleMarkSaga}
          className={clsx(
            'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors whitespace-nowrap',
            allReleasedWatched
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-foreground/10 text-foreground hover:bg-foreground/15'
          )}
        >
          <EyeIcon size={12} />
          {allReleasedWatched ? t('movies.detail.watched') : t('movies.detail.markWatched')}
        </button>
      ) : undefined}
      items={parts}
      loading={loading}
      renderItem={(part, i) => {
        const isCurrent = part.id === movieId
        const isWatched = !!watchedMovies?.[part.id]

        return (
          <div
            onClick={() => !isCurrent && onMovieSelect?.(part.id)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 transition-colors',
              isCurrent
                ? 'bg-cream-300 dark:bg-gray-700 border-l-2 border-primary shadow-[inset_2px_0_0_var(--color-primary)]'
                : 'bg-card hover:bg-cream-400 dark:hover:bg-gray-700',
              !isCurrent && onMovieSelect && 'cursor-pointer',
              isWatched && !isCurrent && 'opacity-60'
            )}
          >
            <span className="text-xs font-mono w-4 text-center text-muted-foreground shrink-0">
              {i + 1}
            </span>

            <div className="relative shrink-0">
              <MediaPoster posterPath={part.poster_path} title={part.title} variant="sm" />
              {isWatched && (
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary border-2 border-card flex items-center justify-center text-primary-foreground">
                  <EyeIcon size={8} strokeWidth={2.5} />
                </span>
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <Text variant="small" className="truncate text-foreground">
                {part.title}
              </Text>
              {part.release_date && (
                <Text variant="caption" className="text-muted-foreground">
                  {new Date(part.release_date).getFullYear()}
                </Text>
              )}
            </div>

            {isCurrent && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-muted px-1.5 py-0.5 rounded">
                {t('movies.detail.current')}
              </span>
            )}
          </div>
        )
      }}
    />
  )
}