import type { FiltersSchema } from '@/types/table'
import type { MovieFilters } from '@/types/movie'

const CURRENT_YEAR = new Date().getFullYear()

export const staticMovieFiltersSchema: FiltersSchema<MovieFilters> = [
  {
    key: 'title',
    label: 'movies.filters.title',
    type: 'text',
  },
  {
    key: 'genre_ids',
    label: 'movies.filters.genres',
    type: 'genre-multi',
    options: [], // populated dynamically in MoviesFeature
  },
  {
    key: 'provider_id',
    label: 'movies.filters.platform',
    type: 'select',
    options: [], // populated dynamically in MoviesFeature
  },
  {
    key: 'vote_average_gte',
    label: 'movies.filters.ratingGte',
    type: 'star',
  },
  {
    key: 'release_year',
    label: 'movies.filters.year',
    type: 'number',
    min: 1900,
    max: CURRENT_YEAR,
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
  {
    key: 'runtime_gte',
    label: 'movies.filters.runtimeGte',
    type: 'number',
    min: 1,
    unit: 'common.minuteUnit',
  },
]
