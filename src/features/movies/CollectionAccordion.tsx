import { useTranslation } from 'react-i18next'
import AccordionList from '@/components/ui/AccordionList'
import MoviePoster from '@/components/common/MoviePoster'
import Text from '@/components/ui/Text'
import clsx from 'clsx'
import { useCollectionDetail } from './useCollectionDetail'
import type { TMDBCollection } from '@/types/tmdb'

type Props = {
  collection: TMDBCollection
  movieId: number
  onMovieSelect?: (id: number) => void
}

export default function CollectionAccordion({ collection, movieId, onMovieSelect }: Props) {
  const { t } = useTranslation()
  const { detail, loading } = useCollectionDetail(collection.id, true)

  const parts =
    detail?.parts
      ?.slice()
      .sort((a, b) => a.release_date.localeCompare(b.release_date)) ?? []

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
      items={parts}
      loading={loading}
      renderItem={(part, i) => {
        const isCurrent = part.id === movieId

        return (
          <div
            onClick={() => !isCurrent && onMovieSelect?.(part.id)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 transition-colors',
              isCurrent
                ? `
                    bg-cream-300 dark:bg-gray-700
                    border-l-2 border-primary
                    shadow-[inset_2px_0_0_var(--color-primary)]
                    `
                : 'bg-card hover:bg-muted/40',
              !isCurrent && onMovieSelect && 'cursor-pointer'
            )}
          >
            <span className="text-xs font-mono w-4 text-center text-muted-foreground">
              {i + 1}
            </span>

            <MoviePoster
              posterPath={part.poster_path}
              title={part.title}
              variant="sm"
            />

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