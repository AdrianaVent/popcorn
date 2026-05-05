import { useAsync } from '@/hooks/useAsync'
import { moviesService } from '@/services/tmdb/movies'
import { WATCH_PROVIDERS_REGION } from '@/config/constants'

const THEATRICAL_TYPE = 3
const MAX_DAYS_IN_THEATERS = 90

export function useMovieInTheaters(id: number | null): { inTheaters: boolean; loading: boolean } {
  const { data, loading } = useAsync<boolean>(
    () =>
      id !== null
        ? moviesService.releaseDates(id).then((r) => {
            const region = r.results.find((x) => x.iso_3166_1 === WATCH_PROVIDERS_REGION)
            if (!region) return false
            const theatrical = region.release_dates.find((d) => d.type === THEATRICAL_TYPE)
            if (!theatrical) return false
            const daysSince = (Date.now() - new Date(theatrical.release_date).getTime()) / 86_400_000
            return daysSince >= 0 && daysSince <= MAX_DAYS_IN_THEATERS
          })
        : null,
    [id],
  )
  return { inTheaters: data ?? false, loading }
}
