import type { FiltersSchema } from '@/types/table'
import type { SeriesFilters } from '@/types/series'

export const seriesFiltersSchema: FiltersSchema<SeriesFilters> = [
  {
    key: 'title',
    label: 'series.filters.title',
    type: 'text',
  },
  {
    key: 'first_air_year',
    label: 'series.filters.year',
    type: 'number',
  },
  {
    key: 'vote_average_gte',
    label: 'series.filters.ratingGte',
    type: 'number',
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
    key: 'watched',
    label: 'series.filters.watched',
    type: 'select',
    options: [
      { value: 'watched', label: 'common.watchedOnly' },
      { value: 'unwatched', label: 'common.unwatchedOnly' },
    ],
  },
]
