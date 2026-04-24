import type { FiltersSchema } from '@/types/table'
import type { MovieFilters } from '@/types/movie'

export const movieFiltersSchema: FiltersSchema<MovieFilters> = [
  {
    key: 'title',
    label: 'movies.filters.title',
    type: 'text',
  },
  {
    key: 'release_year',
    label: 'movies.filters.year',
    type: 'number',
  },
  {
    key: 'vote_average_gte',
    label: 'movies.filters.ratingGte',
    type: 'number',
  },
  {
    key: 'watched',
    label: 'movies.filters.watched',
    type: 'select',
    options: [
      { value: 'watched', label: 'common.watchedOnly' },
      { value: 'unwatched', label: 'common.unwatchedOnly' },
    ],
  },
]
