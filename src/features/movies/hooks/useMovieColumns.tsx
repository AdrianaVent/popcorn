import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import { TitleCell, GenresCell, PosterCell } from '@/components/common/MediaTableCells'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { formatShortDate } from '@/utils/formatDate'
import { formatRuntime, tmdbToStarRating } from '@/utils/formatNumber'
import type { Column } from '@/types/table'
import type { MovieRow } from '@/types/movie'

export function useMovieColumns(runtimes: Map<number, number | null>, inSearchMode: boolean): Column<MovieRow>[] {
  const { t }      = useTranslation()
  const { language } = useLanguageStore()
  const role       = useUserStore((s) => s.role)
  const userId     = useUserStore((s) => s.userId)
  const userKey    = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])

  return useMemo<Column<MovieRow>[]>(() => [
    {
      key: 'poster_path',
      header: t('movies.columns.poster'),
      render: (row) => <PosterCell posterPath={row.poster_path} title={row.title} isWatched={role !== 'admin' && !!watchedMovies?.[row.id]} />,
      width: 'xs',
      align: 'center',
    },
    {
      key: 'title',
      header: t('movies.columns.title'),
      render: (row) => <TitleCell title={row.title} />,
      width: 'flex',
      align: 'left',
      sortable: !inSearchMode,
    },
    {
      key: 'genre_ids',
      header: t('movies.columns.genres'),
      render: (row) => <GenresCell genreIds={row.genre_ids as number[] | undefined} language={language} />,
      width: 'md',
      align: 'left',
    },
    {
      key: 'vote_average',
      header: t('movies.columns.rating'),
      render: (row) => (
        <Tooltip content={`${row.vote_average.toFixed(1)} / 10`} placement="top">
          <div className="flex justify-center">
            <StarRating value={tmdbToStarRating(row.vote_average)} readonly size={14} />
          </div>
        </Tooltip>
      ),
      width: 'md',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'release_date',
      header: t('movies.columns.releaseDate'),
      render: (row) => row.release_date ? formatShortDate(row.release_date, language) : null,
      width: 'md',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'runtime',
      header: t('movies.columns.runtime'),
      render: (row) => {
        if (!runtimes.has(row.id)) return <span className="inline-block h-3 w-10 rounded bg-muted animate-pulse" />
        const rt = runtimes.get(row.id)
        if (!rt) return <span className="text-muted-foreground">—</span>
        return formatRuntime(rt, language)
      },
      width: 'sm',
      align: 'center',
      sortable: true,
    },
  ], [t, language, role, watchedMovies, runtimes, inSearchMode])
}
