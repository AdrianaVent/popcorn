import type { FiltersSchema } from '@/types/table'
import type { MovieFilters } from '@/types/movie'

export const movieFiltersSchema: FiltersSchema<MovieFilters> = [
  {
    key: 'title',
    label: 'movies.filters.title',
    type: 'text',
  },
  {
    key: 'vote_average_gte',
    label: 'movies.filters.ratingGte',
    type: 'number',
  },
  {
    key: 'release_year',
    label: 'movies.filters.year',
    type: 'number',
  },
]
