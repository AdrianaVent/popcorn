import { useWatchlistStore } from '@/store/watchlistStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import type { ReleaseEntry } from '@/services/tmdb/releases'

export function useReleaseWatchlistToggle(release: ReleaseEntry) {
  const isSeries = release.season_number != null
  const role     = useUserStore((s) => s.role)
  const userId   = useUserStore((s) => s.userId)
  const userKey  = String(userId ?? 'guest')

  const isWatched = useWatchedStore((s) =>
    isSeries ? !!s.seriesData[userKey]?.[release.id] : !!s.movies[userKey]?.[release.id]
  )
  const isInWatchlist = useWatchlistStore((s) =>
    isSeries ? !!s.series[userKey]?.[release.id] : !!s.movies[userKey]?.[release.id]
  )
  const toggleWatchlistMovie  = useWatchlistStore((s) => s.toggleMovie)
  const toggleWatchlistSeries = useWatchlistStore((s) => s.toggleSeries)

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSeries) {
      toggleWatchlistSeries(userKey, {
        id: release.id, name: release.title, first_air_date: release.date,
        poster_path: release.poster_path, vote_average: 0, vote_count: 0,
        original_language: '', addedAt: Date.now(),
      })
    } else {
      toggleWatchlistMovie(userKey, {
        id: release.id, title: release.title, release_date: release.date,
        poster_path: release.poster_path, vote_average: 0, vote_count: 0,
        original_language: '', addedAt: Date.now(),
      })
    }
  }

  return { isWatched, isInWatchlist, handleToggleWatchlist, role }
}
