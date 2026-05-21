import type { TMDBSeriesDetail } from '@/types/tmdb'

export type StatusConfig = {
  labelKey: string
  border: string
  bg: string
  text: string
  ribbon: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  'Returning Series': {
    labelKey: 'series.status.returning',
    border: 'border-green-500/30',
    bg: 'bg-green-100/60 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    ribbon: 'bg-green-500 text-white',
  },
  'In Production': {
    labelKey: 'series.status.inProduction',
    border: 'border-blue-500/30',
    bg: 'bg-blue-100/60 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    ribbon: 'bg-blue-500 text-white',
  },
  'Planned': {
    labelKey: 'series.status.planned',
    border: 'border-amber-500/30',
    bg: 'bg-amber-100/60 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    ribbon: 'bg-amber-500 text-white',
  },
  'Ended': {
    labelKey: 'series.status.ended',
    border: 'border-border',
    bg: 'bg-muted/60',
    text: 'text-muted-foreground',
    ribbon: 'bg-gray-400 text-white',
  },
  'Canceled': {
    labelKey: 'series.status.canceled',
    border: 'border-red-500/30',
    bg: 'bg-red-100/60 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    ribbon: 'bg-red-500 text-white',
  },
  'Pilot': {
    labelKey: 'series.status.pilot',
    border: 'border-purple-500/30',
    bg: 'bg-purple-100/60 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    ribbon: 'bg-purple-500 text-white',
  },
}

export type SeriesUI = {
  statusConfig: StatusConfig | null
  firstAirYear: number | null
  avgRuntime: number | null
}

export function getStatusConfig(status: string): StatusConfig | null {
  return STATUS_MAP[status] ?? null
}

export function getSeriesUI(detail?: TMDBSeriesDetail | null): SeriesUI {
  if (!detail) return { statusConfig: null, firstAirYear: null, avgRuntime: null }

  return {
    statusConfig: STATUS_MAP[detail.status] ?? null,
    firstAirYear: detail.first_air_date
      ? new Date(detail.first_air_date).getFullYear()
      : null,
    avgRuntime: detail.episode_run_time[0] ?? null,
  }
}
