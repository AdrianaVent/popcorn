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
    key: 'release_year_gte',
    keyTo: 'release_year_lte',
    label: 'movies.filters.year',
    type: 'year-range',
    options: Array.from({ length: CURRENT_YEAR + 5 - 1900 + 1 }, (_, i) => {
      const year = CURRENT_YEAR + 5 - i
      return { value: year, label: String(year) }
    }),
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
    key: 'in_theaters',
    label: 'movies.filters.inTheaters',
    type: 'boolean',
  },
  {
    key: 'runtime_gte',
    label: 'movies.filters.runtimeGte',
    type: 'number',
    min: 1,
    units: [
      { value: 'd', label: 'common.units.d', multiplier: 1440 },
      { value: 'h', label: 'common.units.h', multiplier: 60 },
      { value: 'min', label: 'common.units.min', multiplier: 1 },
    ],
  },
]
