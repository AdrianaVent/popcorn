import { useWatchedStore } from './watchedStore'
import { useWatchlistStore } from './watchlistStore'
import type { StoredMovie, StoredSeries } from './watchedStore'
import type { WatchlistMovie, WatchlistSeries } from './watchlistStore'

const mockMovie: StoredMovie = {
  id: 1,
  title: 'Test Movie',
  release_date: '2023-01-01',
  vote_average: 8.0,
  vote_count: 1000,
  poster_path: null,
  original_language: 'en',
}

const mockSeries: StoredSeries = {
  id: 10,
  name: 'Test Series',
  first_air_date: '2022-01-01',
  vote_average: 8.5,
  vote_count: 500,
  poster_path: null,
  original_language: 'en',
  number_of_episodes: 10,
}

const watchlistMovie: WatchlistMovie = {
  id: 1, title: 'Test Movie', release_date: '2023-01-01',
  poster_path: null, vote_average: 0, vote_count: 0, original_language: 'en', addedAt: 0,
}

const watchlistSeries: WatchlistSeries = {
  id: 10, name: 'Test Series', first_air_date: '2022-01-01',
  poster_path: null, vote_average: 0, vote_count: 0, original_language: 'en', addedAt: 0,
}

beforeEach(() => {
  useWatchedStore.setState({ movies: {}, episodes: {}, seriesData: {} })
  useWatchlistStore.setState({ movies: {}, series: {} })
})

describe('toggleMovie', () => {
  it('adds a movie snapshot when not watched', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchedStore.getState().movies['user1'][1]).toEqual(expect.objectContaining(mockMovie))
  })

  it('sets watchedAt timestamp when adding a movie', () => {
    const before = Date.now()
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    const after = Date.now()
    const stored = useWatchedStore.getState().movies['user1'][1]
    expect(stored.watchedAt).toBeGreaterThanOrEqual(before)
    expect(stored.watchedAt).toBeLessThanOrEqual(after)
  })

  it('does not set watchedAt when removing a movie', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchedStore.getState().movies['user1']?.[1]).toBeUndefined()
  })

  it('removes the movie on second toggle', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchedStore.getState().movies['user1'][1]).toBeUndefined()
  })

  it('isolates data between users', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchedStore.getState().movies['user2']).toBeUndefined()
  })
})

describe('toggleEpisode', () => {
  it('stores episode with the correct seasonNumber', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 2)
    expect(useWatchedStore.getState().episodes['user1'][10][101]).toEqual({ seasonNumber: 2 })
  })

  it('removes the episode on second toggle', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 2)
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 2)
    expect(useWatchedStore.getState().episodes['user1'][10][101]).toBeUndefined()
  })

  it('stores the series snapshot on the first episode mark', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    expect(useWatchedStore.getState().seriesData['user1'][10]).toEqual(expect.objectContaining(mockSeries))
  })

  it('sets watchedAt on first episode mark', () => {
    const before = Date.now()
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    const after = Date.now()
    const stored = useWatchedStore.getState().seriesData['user1'][10]
    expect(stored.watchedAt).toBeGreaterThanOrEqual(before)
    expect(stored.watchedAt).toBeLessThanOrEqual(after)
  })

  it('does not overwrite watchedAt on subsequent episode marks', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    const firstWatchedAt = useWatchedStore.getState().seriesData['user1'][10].watchedAt
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1, mockSeries)
    expect(useWatchedStore.getState().seriesData['user1'][10].watchedAt).toBe(firstWatchedAt)
  })

  it('does not overwrite an existing series snapshot on subsequent marks', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    const updated = { ...mockSeries, name: 'Updated Name' }
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1, updated)
    expect(useWatchedStore.getState().seriesData['user1'][10].name).toBe('Test Series')
  })

  it('removes the series from seriesData when the last episode is unmarked', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    expect(useWatchedStore.getState().seriesData['user1']?.[10]).toBeUndefined()
  })

  it('keeps seriesData when other episodes remain after unmark', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1)
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    expect(useWatchedStore.getState().seriesData['user1'][10]).toEqual(expect.objectContaining(mockSeries))
  })

  it('marks multiple episodes for the same series independently', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1)
    useWatchedStore.getState().toggleEpisode('user1', 10, 201, 2)
    const eps = useWatchedStore.getState().episodes['user1'][10]
    expect(Object.keys(eps)).toHaveLength(3)
  })

  it('isolates data between users', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    expect(useWatchedStore.getState().episodes['user2']).toBeUndefined()
  })
})

describe('markSeason', () => {
  const episodeIds = [101, 102, 103]

  it('marks all episodes of a season as watched', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    const eps = useWatchedStore.getState().episodes['user1'][10]
    episodeIds.forEach((id) => {
      expect(eps[id]).toEqual({ seasonNumber: 1 })
    })
  })

  it('unmarks all episodes when all are already watched', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    const eps = useWatchedStore.getState().episodes['user1'][10]
    episodeIds.forEach((id) => {
      expect(eps[id]).toBeUndefined()
    })
  })

  it('marks remaining episodes when some are already watched', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    const eps = useWatchedStore.getState().episodes['user1'][10]
    episodeIds.forEach((id) => {
      expect(eps[id]).toEqual({ seasonNumber: 1 })
    })
  })

  it('stores the series snapshot on first mark', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    expect(useWatchedStore.getState().seriesData['user1'][10]).toEqual(expect.objectContaining(mockSeries))
  })

  it('sets watchedAt on first markSeason', () => {
    const before = Date.now()
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    const after = Date.now()
    const stored = useWatchedStore.getState().seriesData['user1'][10]
    expect(stored.watchedAt).toBeGreaterThanOrEqual(before)
    expect(stored.watchedAt).toBeLessThanOrEqual(after)
  })

  it('does not overwrite an existing series snapshot', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, [101], mockSeries)
    const updated = { ...mockSeries, name: 'Updated' }
    useWatchedStore.getState().markSeason('user1', 10, 2, [201], updated)
    expect(useWatchedStore.getState().seriesData['user1'][10].name).toBe('Test Series')
  })

  it('removes the series from seriesData when the last episodes are unmarked via markSeason', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds)
    expect(useWatchedStore.getState().seriesData['user1']?.[10]).toBeUndefined()
  })

  it('keeps seriesData when episodes in other seasons remain after season unmark', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    useWatchedStore.getState().toggleEpisode('user1', 10, 201, 2)
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds)
    expect(useWatchedStore.getState().seriesData['user1'][10]).toEqual(expect.objectContaining(mockSeries))
  })

  it('does not affect episodes in other seasons', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 201, 2)
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    expect(useWatchedStore.getState().episodes['user1'][10][201]).toEqual({ seasonNumber: 2 })
  })

  it('isolates data between users', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, episodeIds, mockSeries)
    expect(useWatchedStore.getState().episodes['user2']).toBeUndefined()
  })
})

describe('enrichMovie', () => {
  it('merges patch fields into an existing stored movie', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    useWatchedStore.getState().enrichMovie('user1', 1, { collection_id: 99, collection_name: 'Test Saga' })
    const stored = useWatchedStore.getState().movies['user1'][1]
    expect(stored.collection_id).toBe(99)
    expect(stored.collection_name).toBe('Test Saga')
  })

  it('preserves existing fields when patching', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    useWatchedStore.getState().enrichMovie('user1', 1, { collection_id: 99, collection_name: 'Test Saga' })
    const stored = useWatchedStore.getState().movies['user1'][1]
    expect(stored.title).toBe('Test Movie')
    expect(stored.vote_average).toBe(8.0)
  })

  it('does nothing if the movie is not in the watched list', () => {
    useWatchedStore.getState().enrichMovie('user1', 999, { collection_id: 99, collection_name: 'Test Saga' })
    expect(useWatchedStore.getState().movies['user1']).toBeUndefined()
  })

  it('isolates enrichment between users', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    useWatchedStore.getState().enrichMovie('user2', 1, { collection_id: 99, collection_name: 'Test Saga' })
    const stored = useWatchedStore.getState().movies['user1'][1]
    expect(stored.collection_id).toBeUndefined()
  })
})

describe('per-season watched count derivation', () => {
  it('correctly counts watched episodes per season', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1)
    useWatchedStore.getState().toggleEpisode('user1', 10, 201, 2)

    const eps = useWatchedStore.getState().episodes['user1'][10]
    const season1Count = Object.values(eps).filter((ep) => ep.seasonNumber === 1).length
    const season2Count = Object.values(eps).filter((ep) => ep.seasonNumber === 2).length

    expect(season1Count).toBe(2)
    expect(season2Count).toBe(1)
  })

  it('returns 0 for a season with no watched episodes', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1)
    const eps = useWatchedStore.getState().episodes['user1'][10]
    const season2Count = Object.values(eps).filter((ep) => ep.seasonNumber === 2).length
    expect(season2Count).toBe(0)
  })
})

describe('purgeUpcomingMovies', () => {
  const past   = '2020-01-01'
  const future = '2099-01-01'

  const pastMovie: StoredMovie   = { ...mockMovie, id: 2, release_date: past }
  const futureMovie: StoredMovie = { ...mockMovie, id: 3, release_date: future }

  it('removes a movie whose release_date is in the future', () => {
    useWatchedStore.getState().toggleMovie('user1', futureMovie)
    useWatchedStore.getState().purgeUpcomingMovies('user1')
    expect(useWatchedStore.getState().movies['user1']?.[3]).toBeUndefined()
  })

  it('keeps a movie whose release_date is in the past', () => {
    useWatchedStore.getState().toggleMovie('user1', pastMovie)
    useWatchedStore.getState().purgeUpcomingMovies('user1')
    expect(useWatchedStore.getState().movies['user1'][2]).toBeDefined()
  })

  it('keeps a movie with no release_date', () => {
    const undated: StoredMovie = { ...mockMovie, id: 4, release_date: '' }
    useWatchedStore.getState().toggleMovie('user1', undated)
    useWatchedStore.getState().purgeUpcomingMovies('user1')
    expect(useWatchedStore.getState().movies['user1'][4]).toBeDefined()
  })

  it('removes only future movies when past and future coexist', () => {
    useWatchedStore.getState().toggleMovie('user1', pastMovie)
    useWatchedStore.getState().toggleMovie('user1', futureMovie)
    useWatchedStore.getState().purgeUpcomingMovies('user1')
    expect(useWatchedStore.getState().movies['user1'][2]).toBeDefined()
    expect(useWatchedStore.getState().movies['user1']?.[3]).toBeUndefined()
  })

  it('does not affect other users', () => {
    useWatchedStore.getState().toggleMovie('user1', futureMovie)
    useWatchedStore.getState().toggleMovie('user2', futureMovie)
    useWatchedStore.getState().purgeUpcomingMovies('user1')
    expect(useWatchedStore.getState().movies['user2'][3]).toBeDefined()
  })

  it('is a no-op when the user has no upcoming movies', () => {
    useWatchedStore.getState().toggleMovie('user1', pastMovie)
    useWatchedStore.getState().purgeUpcomingMovies('user1')
    expect(useWatchedStore.getState().movies['user1'][2]).toBeDefined()
  })

  it('is a no-op when the user has no watched movies at all', () => {
    expect(() => useWatchedStore.getState().purgeUpcomingMovies('user1')).not.toThrow()
  })
})

describe('purgeUpcomingSeries', () => {
  const past   = '2020-01-01'
  const future = '2099-01-01'

  const pastSeries: StoredSeries   = { ...mockSeries, id: 20, first_air_date: past }
  const futureSeries: StoredSeries = { ...mockSeries, id: 21, first_air_date: future }

  it('removes a series whose first_air_date is in the future', () => {
    useWatchedStore.getState().toggleEpisode('user1', 21, 201, 1, futureSeries)
    useWatchedStore.getState().purgeUpcomingSeries('user1')
    expect(useWatchedStore.getState().seriesData['user1']?.[21]).toBeUndefined()
    expect(useWatchedStore.getState().episodes['user1']?.[21]).toBeUndefined()
  })

  it('keeps a series whose first_air_date is in the past', () => {
    useWatchedStore.getState().toggleEpisode('user1', 20, 101, 1, pastSeries)
    useWatchedStore.getState().purgeUpcomingSeries('user1')
    expect(useWatchedStore.getState().seriesData['user1'][20]).toBeDefined()
    expect(useWatchedStore.getState().episodes['user1'][20]).toBeDefined()
  })

  it('keeps a series with no first_air_date', () => {
    const undated: StoredSeries = { ...mockSeries, id: 22, first_air_date: '' }
    useWatchedStore.getState().toggleEpisode('user1', 22, 301, 1, undated)
    useWatchedStore.getState().purgeUpcomingSeries('user1')
    expect(useWatchedStore.getState().seriesData['user1'][22]).toBeDefined()
  })

  it('removes only future series when past and future coexist', () => {
    useWatchedStore.getState().toggleEpisode('user1', 20, 101, 1, pastSeries)
    useWatchedStore.getState().toggleEpisode('user1', 21, 201, 1, futureSeries)
    useWatchedStore.getState().purgeUpcomingSeries('user1')
    expect(useWatchedStore.getState().seriesData['user1'][20]).toBeDefined()
    expect(useWatchedStore.getState().seriesData['user1']?.[21]).toBeUndefined()
  })

  it('does not affect other users', () => {
    useWatchedStore.getState().toggleEpisode('user1', 21, 201, 1, futureSeries)
    useWatchedStore.getState().toggleEpisode('user2', 21, 201, 1, futureSeries)
    useWatchedStore.getState().purgeUpcomingSeries('user1')
    expect(useWatchedStore.getState().seriesData['user2'][21]).toBeDefined()
  })

  it('is a no-op when the user has no upcoming series', () => {
    useWatchedStore.getState().toggleEpisode('user1', 20, 101, 1, pastSeries)
    useWatchedStore.getState().purgeUpcomingSeries('user1')
    expect(useWatchedStore.getState().seriesData['user1'][20]).toBeDefined()
  })

  it('is a no-op when the user has no watched series at all', () => {
    expect(() => useWatchedStore.getState().purgeUpcomingSeries('user1')).not.toThrow()
  })
})

describe('auto-remove from watchlist', () => {
  it('removes movie from watchlist when marked as watched', () => {
    useWatchlistStore.getState().toggleMovie('user1', watchlistMovie)
    expect(useWatchlistStore.getState().movies['user1'][1]).toBeDefined()
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchlistStore.getState().movies['user1']?.[1]).toBeUndefined()
  })

  it('does not remove movie from watchlist when unmarking watched', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    useWatchlistStore.getState().toggleMovie('user1', watchlistMovie)
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchlistStore.getState().movies['user1'][1]).toBeDefined()
  })

  it('removes series from watchlist on first episode mark', () => {
    useWatchlistStore.getState().toggleSeries('user1', watchlistSeries)
    expect(useWatchlistStore.getState().series['user1'][10]).toBeDefined()
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    expect(useWatchlistStore.getState().series['user1']?.[10]).toBeUndefined()
  })

  it('does not remove series from watchlist on subsequent episode marks', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    useWatchlistStore.getState().toggleSeries('user1', watchlistSeries)
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1, mockSeries)
    expect(useWatchlistStore.getState().series['user1'][10]).toBeDefined()
  })

  it('removes series from watchlist on first markSeason', () => {
    useWatchlistStore.getState().toggleSeries('user1', watchlistSeries)
    expect(useWatchlistStore.getState().series['user1'][10]).toBeDefined()
    useWatchedStore.getState().markSeason('user1', 10, 1, [101, 102], mockSeries)
    expect(useWatchlistStore.getState().series['user1']?.[10]).toBeUndefined()
  })

  it('does not remove series from watchlist when unmarking a season', () => {
    useWatchedStore.getState().markSeason('user1', 10, 1, [101, 102], mockSeries)
    useWatchlistStore.getState().toggleSeries('user1', watchlistSeries)
    useWatchedStore.getState().markSeason('user1', 10, 1, [101, 102], mockSeries)
    expect(useWatchlistStore.getState().series['user1'][10]).toBeDefined()
  })
})
