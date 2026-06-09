import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import StarRating from '@/components/ui/StarRating'
import Tooltip from '@/components/ui/Tooltip'
import { TitleCell, GenresCell, PosterCell } from '@/components/common/MediaTableCells'
import StatusBadge from '../components/StatusBadge'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { formatShortDate } from '@/utils/formatDate'
import { formatRuntime, tmdbToStarRating } from '@/utils/formatNumber'
import type { Column } from '@/types/table'
import type { SeriesRow } from '@/types/series'

export function useSeriesColumns(
  statuses: Map<number, string>,
  totals: Map<number, number>,
  runtimes: Map<number, number | null>,
  genreIds: Map<number, number[] | undefined>,
  inSearchMode: boolean,
): Column<SeriesRow>[] {
  const { t }      = useTranslation()
  const { language } = useLanguageStore()
  const role       = useUserStore((s) => s.role)
  const userId     = useUserStore((s) => s.userId)
  const userKey    = String(userId ?? 'guest')
  const seriesEpisodes = useWatchedStore((s) => s.episodes[userKey])

  return useMemo<Column<SeriesRow>[]>(() => [
    {
      key: 'poster_path',
      header: t('series.columns.poster'),
      render: (row) => {
        const total   = totals.get(row.id) ?? 0
        const watched = Object.keys(seriesEpisodes?.[row.id] ?? {}).length
        return <PosterCell posterPath={row.poster_path} title={row.name} isWatched={role !== 'admin' && total > 0 && watched >= total} />
      },
      width: 'xs',
      align: 'center',
    },
    {
      key: 'name',
      header: t('series.columns.title'),
      render: (row) => <TitleCell title={row.name} />,
      width: 'flex',
      align: 'left',
      sortable: !inSearchMode,
    },
    {
      key: 'status',
      header: t('series.columns.status'),
      render: (row) => <StatusBadge status={statuses.get(row.id)} />,
      width: 'md',
      align: 'center',
    },
    {
      key: 'genre_ids',
      header: t('series.columns.genres'),
      render: (row) => <GenresCell genreIds={genreIds.get(row.id) ?? row.genre_ids} language={language} />,
      width: 'md',
      align: 'left',
    },
    {
      key: 'vote_average',
      header: t('series.columns.rating'),
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
      key: 'first_air_date',
      header: t('series.columns.firstAirDate'),
      render: (row) => row.first_air_date ? formatShortDate(row.first_air_date, language) : null,
      width: 'md',
      align: 'center',
      sortable: !inSearchMode,
    },
    {
      key: 'runtime',
      header: t('series.columns.runtime'),
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
  ], [t, language, role, seriesEpisodes, statuses, totals, runtimes, genreIds, inSearchMode])
}
