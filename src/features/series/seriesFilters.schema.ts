import type { FiltersSchema } from '@/types/table'
import type { SeriesFilters } from '@/types/series'

const CURRENT_YEAR = new Date().getFullYear()

export const staticSeriesFiltersSchema: FiltersSchema<SeriesFilters> = [
  {
    key: 'title',
    label: 'series.filters.title',
    type: 'text',
  },
  {
    key: 'status',
    label: 'series.filters.status',
    type: 'select',
    options: [
      { value: '0', label: 'series.status.returning' },
      { value: '2', label: 'series.status.inProduction' },
      { value: '1', label: 'series.status.planned' },
      { value: '3', label: 'series.status.ended' },
      { value: '4', label: 'series.status.canceled' },
    ],
  },
  {
    key: 'genre_ids',
    label: 'series.filters.genres',
    type: 'genre-multi',
    options: [], // populated dynamically in SeriesFeature
  },
  {
    key: 'provider_id',
    label: 'series.filters.platform',
    type: 'select',
    options: [], // populated dynamically in SeriesFeature
  },
  {
    key: 'vote_average_gte',
    label: 'series.filters.ratingGte',
    type: 'star',
  },
  {
    key: 'first_air_year_gte',
    keyTo: 'first_air_year_lte',
    label: 'series.filters.year',
    type: 'year-range',
    options: Array.from({ length: CURRENT_YEAR + 5 - 1950 + 1 }, (_, i) => {
      const year = CURRENT_YEAR + 5 - i
      return { value: year, label: String(year) }
    }),
  },
  {
    key: 'watched',
    label: 'series.filters.watched',
    type: 'select',
    options: [
      { value: 'watched', label: 'common.watchedOnly' },
      { value: 'unwatched', label: 'common.unwatchedOnly' },
    ],
  },
  {
    key: 'runtime_gte',
    label: 'series.filters.runtimeGte',
    type: 'number',
    min: 1,
    units: [
      { value: 'd', label: 'common.units.d', multiplier: 1440 },
      { value: 'h', label: 'common.units.h', multiplier: 60 },
      { value: 'min', label: 'common.units.min', multiplier: 1 },
    ],
  },
]
