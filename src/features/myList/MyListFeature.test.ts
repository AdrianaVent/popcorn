import { formatSagaName, groupAndSortMovies, computeSagasFirst, binPackSagas } from './MyListFeature'
import type { StoredMovie } from '@/store/watchedStore'
import type { SagaGroup } from './MyListFeature'

const makeMovie = (overrides: Partial<StoredMovie> & { id: number }): StoredMovie => ({
  title: `Movie ${overrides.id}`,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 1000,
  poster_path: null,
  original_language: 'en',
  watchedAt: 1000,
  ...overrides,
})

// ─── formatSagaName ───────────────────────────────────────────────────────────

describe('formatSagaName', () => {
  it('replaces "Collection" with "- Saga" when no dash present', () => {
    expect(formatSagaName('Avatar Collection')).toBe('Avatar - Saga')
  })

  it('replaces "Colección" with "- Saga" when no dash present', () => {
    expect(formatSagaName('Harry Potter Colección')).toBe('Harry Potter - Saga')
  })

  it('preserves a single "- Saga" when the original already has a dash', () => {
    expect(formatSagaName('Harry Potter - Colección')).toBe('Harry Potter - Saga')
  })

  it('is case-insensitive for "Collection"', () => {
    expect(formatSagaName('Alien collection')).toBe('Alien - Saga')
    expect(formatSagaName('ALIEN COLLECTION')).toBe('ALIEN - Saga')
  })

  it('trims surrounding whitespace', () => {
    expect(formatSagaName('  Saga  ')).toBe('Saga')
  })

  it('leaves names without "Collection" or "Colección" unchanged', () => {
    expect(formatSagaName('The Dark Knight')).toBe('The Dark Knight')
  })
})

// ─── groupAndSortMovies ───────────────────────────────────────────────────────

describe('groupAndSortMovies', () => {
  it('puts movies without collection_id in standaloneMovies', () => {
    const movies = [makeMovie({ id: 1 }), makeMovie({ id: 2 })]
    const { standaloneMovies, sagaGroups } = groupAndSortMovies(movies)
    expect(standaloneMovies).toHaveLength(2)
    expect(sagaGroups).toHaveLength(0)
  })

  it('groups movies with the same collection_id into one saga', () => {
    const movies = [
      makeMovie({ id: 1, collection_id: 10, collection_name: 'X Collection' }),
      makeMovie({ id: 2, collection_id: 10, collection_name: 'X Collection' }),
    ]
    const { sagaGroups, standaloneMovies } = groupAndSortMovies(movies)
    expect(sagaGroups).toHaveLength(1)
    expect(sagaGroups[0].movies).toHaveLength(2)
    expect(standaloneMovies).toHaveLength(0)
  })

  it('keeps different collections in separate groups', () => {
    const movies = [
      makeMovie({ id: 1, collection_id: 10, collection_name: 'A Collection' }),
      makeMovie({ id: 2, collection_id: 20, collection_name: 'B Collection' }),
    ]
    const { sagaGroups } = groupAndSortMovies(movies)
    expect(sagaGroups).toHaveLength(2)
  })

  it('sorts movies within a saga by release_date ascending', () => {
    const movies = [
      makeMovie({ id: 2, collection_id: 10, collection_name: 'X', release_date: '2015-01-01', watchedAt: 2000 }),
      makeMovie({ id: 1, collection_id: 10, collection_name: 'X', release_date: '2010-01-01', watchedAt: 1000 }),
    ]
    const { sagaGroups } = groupAndSortMovies(movies)
    expect(sagaGroups[0].movies[0].id).toBe(1)
    expect(sagaGroups[0].movies[1].id).toBe(2)
  })

  it('sorts saga groups by most recent movie watchedAt descending', () => {
    const movies = [
      makeMovie({ id: 1, collection_id: 10, collection_name: 'Old Saga', release_date: '2010-01-01', watchedAt: 1000 }),
      makeMovie({ id: 2, collection_id: 20, collection_name: 'New Saga', release_date: '2015-01-01', watchedAt: 9000 }),
    ]
    const { sagaGroups } = groupAndSortMovies(movies)
    expect(sagaGroups[0].id).toBe(20)
    expect(sagaGroups[1].id).toBe(10)
  })

  it('saga group order uses the highest watchedAt among its movies', () => {
    const movies = [
      makeMovie({ id: 1, collection_id: 10, collection_name: 'A', release_date: '2010-01-01', watchedAt: 500 }),
      makeMovie({ id: 2, collection_id: 10, collection_name: 'A', release_date: '2012-01-01', watchedAt: 8000 }),
      makeMovie({ id: 3, collection_id: 20, collection_name: 'B', release_date: '2014-01-01', watchedAt: 5000 }),
    ]
    const { sagaGroups } = groupAndSortMovies(movies)
    // Saga A has max watchedAt 8000 > Saga B 5000
    expect(sagaGroups[0].id).toBe(10)
    expect(sagaGroups[1].id).toBe(20)
  })

  it('treats a movie with collection_id but no collection_name as standalone', () => {
    const movie = makeMovie({ id: 1, collection_id: 10 })
    const { sagaGroups, standaloneMovies } = groupAndSortMovies([movie])
    expect(sagaGroups).toHaveLength(0)
    expect(standaloneMovies).toHaveLength(1)
  })

  it('treats a movie with collection_name but no collection_id as standalone', () => {
    const movie = makeMovie({ id: 1, collection_name: 'Orphan Collection' })
    const { sagaGroups, standaloneMovies } = groupAndSortMovies([movie])
    expect(sagaGroups).toHaveLength(0)
    expect(standaloneMovies).toHaveLength(1)
  })

  it('separates standalone and saga movies correctly when both are present', () => {
    const movies = [
      makeMovie({ id: 1 }),
      makeMovie({ id: 2, collection_id: 10, collection_name: 'X Collection' }),
    ]
    const { standaloneMovies, sagaGroups } = groupAndSortMovies(movies)
    expect(standaloneMovies).toHaveLength(1)
    expect(standaloneMovies[0].id).toBe(1)
    expect(sagaGroups).toHaveLength(1)
    expect(sagaGroups[0].movies[0].id).toBe(2)
  })

  it('returns empty arrays for empty input', () => {
    const { sagaGroups, standaloneMovies } = groupAndSortMovies([])
    expect(sagaGroups).toHaveLength(0)
    expect(standaloneMovies).toHaveLength(0)
  })
})

// ─── binPackSagas ─────────────────────────────────────────────────────────────

describe('binPackSagas', () => {
  const SAGA_PX = (n: number) => 108 * n + 12
  const SAGA_GAP = 16

  const makeGroup = (id: number, movieCount = 2): SagaGroup => ({
    id,
    name: `Saga ${id}`,
    movies: Array.from({ length: movieCount }, (_, i) =>
      makeMovie({ id: id * 100 + i, collection_id: id, collection_name: `Saga ${id}` })
    ),
  })

  it('returns empty array for empty input', () => {
    expect(binPackSagas([], [], 1000)).toEqual([])
  })

  it('places a single group in a single row', () => {
    const group = makeGroup(1, 2)
    const result = binPackSagas([group], [2], 1000)
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(1)
    expect(result[0][0].id).toBe(1)
  })

  it('keeps two groups in the same row when they fit exactly', () => {
    const g1 = makeGroup(1, 2)
    const g2 = makeGroup(2, 2)
    const container = SAGA_PX(2) + SAGA_GAP + SAGA_PX(2)
    const result = binPackSagas([g1, g2], [2, 2], container)
    expect(result).toHaveLength(1)
    expect(result[0].map((g) => g.id)).toEqual([1, 2])
  })

  it('places the second group in a new row when it does not fit', () => {
    const g1 = makeGroup(1, 3)
    const g2 = makeGroup(2, 3)
    const container = SAGA_PX(3) // only fits one 3-movie saga
    const result = binPackSagas([g1, g2], [3, 3], container)
    expect(result).toHaveLength(2)
    expect(result[0][0].id).toBe(1)
    expect(result[1][0].id).toBe(2)
  })

  it('always keeps the first group in the first position of the first row', () => {
    const groups = [makeGroup(1, 4), makeGroup(2, 3), makeGroup(3, 2)]
    const result = binPackSagas(groups, [4, 3, 2], 1000)
    expect(result[0][0].id).toBe(1)
  })

  it('fills a gap in an existing row before opening a new one (bin packing)', () => {
    // g1 (4) = 444px → row 0. Container = 700px (444 remaining: 240px)
    // g2 (3) = 336px → 444+16+336=796 > 700 → new row 1
    // g3 (2) = 228px → row 0: 444+16+228=688 ≤ 700 → fits in row 0
    const g1 = makeGroup(1, 4)
    const g2 = makeGroup(2, 3)
    const g3 = makeGroup(3, 2)
    const result = binPackSagas([g1, g2, g3], [4, 3, 2], 700)
    expect(result[0].map((g) => g.id)).toEqual([1, 3])
    expect(result[1].map((g) => g.id)).toEqual([2])
  })

  it('uses displayedCounts instead of movies.length for width calculation', () => {
    // g1 has 1 watched movie but displayedCount=4 (placeholders counted)
    // SAGA_PX(4)=444. Container=500 → g2 (SAGA_PX(2)=228) does not fit (444+16+228=688)
    const g1 = makeGroup(1, 1)
    const g2 = makeGroup(2, 2)
    const result = binPackSagas([g1, g2], [4, 2], 500)
    expect(result).toHaveLength(2)
  })
})

// ─── computeSagasFirst ────────────────────────────────────────────────────────

describe('computeSagasFirst', () => {
  it('returns true when the latest saga movie is more recent than any standalone', () => {
    const sagaGroups = [{ id: 10, name: 'X', movies: [makeMovie({ id: 1, watchedAt: 9000 })] }]
    const standalone = [makeMovie({ id: 2, watchedAt: 1000 })]
    expect(computeSagasFirst(sagaGroups, standalone)).toBe(true)
  })

  it('returns false when the latest standalone movie is more recent than any saga', () => {
    const sagaGroups = [{ id: 10, name: 'X', movies: [makeMovie({ id: 1, watchedAt: 1000 })] }]
    const standalone = [makeMovie({ id: 2, watchedAt: 9000 })]
    expect(computeSagasFirst(sagaGroups, standalone)).toBe(false)
  })

  it('returns true on a tie (saga wins)', () => {
    const sagaGroups = [{ id: 10, name: 'X', movies: [makeMovie({ id: 1, watchedAt: 5000 })] }]
    const standalone = [makeMovie({ id: 2, watchedAt: 5000 })]
    expect(computeSagasFirst(sagaGroups, standalone)).toBe(true)
  })

  it('returns true when there are no standalone movies', () => {
    const sagaGroups = [{ id: 10, name: 'X', movies: [makeMovie({ id: 1, watchedAt: 1000 })] }]
    expect(computeSagasFirst(sagaGroups, [])).toBe(true)
  })

  it('returns false when there are no saga groups', () => {
    const standalone = [makeMovie({ id: 1, watchedAt: 1000 })]
    expect(computeSagasFirst([], standalone)).toBe(false)
  })

  it('handles missing watchedAt (treats as 0)', () => {
    const sagaGroups = [{ id: 10, name: 'X', movies: [makeMovie({ id: 1, watchedAt: undefined })] }]
    const standalone = [makeMovie({ id: 2, watchedAt: 1 })]
    expect(computeSagasFirst(sagaGroups, standalone)).toBe(false)
  })

  it('uses the maximum watchedAt across all saga movies', () => {
    const sagaGroups = [
      {
        id: 10, name: 'X', movies: [
          makeMovie({ id: 1, watchedAt: 100 }),
          makeMovie({ id: 2, watchedAt: 9000 }),
        ],
      },
    ]
    const standalone = [makeMovie({ id: 3, watchedAt: 5000 })]
    expect(computeSagasFirst(sagaGroups, standalone)).toBe(true)
  })
})
