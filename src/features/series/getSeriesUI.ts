import type { TMDBSeriesDetail } from '@/types/tmdb'

const TV_GENRE_ES: Record<number, string> = {
  10759: 'Acción y aventura',
  16:    'Animación',
  35:    'Comedia',
  80:    'Crimen',
  99:    'Documental',
  18:    'Drama',
  10751: 'Familia',
  10762: 'Niños',
  9648:  'Misterio',
  10763: 'Noticias',
  10764: 'Reality',
  10765: 'Ciencia ficción y fantasía',
  10766: 'Telenovela',
  10767: 'Tertulias',
  10768: 'Guerra y política',
  37:    'Western',
}

export function resolveSeriesGenreName(id: number, fallback: string, language: string): string {
  return language === 'es' ? (TV_GENRE_ES[id] ?? fallback) : fallback
}

export type StatusConfig = {
  labelKey: string
  border: string
  bg: string
  text: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  'Returning Series': {
    labelKey: 'series.status.returning',
    border: 'border-green-500/30',
    bg: 'bg-green-100/60 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
  },
  'In Production': {
    labelKey: 'series.status.inProduction',
    border: 'border-blue-500/30',
    bg: 'bg-blue-100/60 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
  },
  'Planned': {
    labelKey: 'series.status.planned',
    border: 'border-amber-500/30',
    bg: 'bg-amber-100/60 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
  },
  'Ended': {
    labelKey: 'series.status.ended',
    border: 'border-border',
    bg: 'bg-muted/60',
    text: 'text-muted-foreground',
  },
  'Canceled': {
    labelKey: 'series.status.canceled',
    border: 'border-red-500/30',
    bg: 'bg-red-100/60 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
  },
  'Pilot': {
    labelKey: 'series.status.pilot',
    border: 'border-purple-500/30',
    bg: 'bg-purple-100/60 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
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
