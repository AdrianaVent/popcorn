import { useWatchedStore } from './watchedStore'
import type { StoredMovie, StoredSeries } from './watchedStore'

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

beforeEach(() => {
  useWatchedStore.setState({ movies: {}, episodes: {}, seriesData: {} })
})

describe('toggleMovie', () => {
  it('adds a movie snapshot when not watched', () => {
    useWatchedStore.getState().toggleMovie('user1', mockMovie)
    expect(useWatchedStore.getState().movies['user1'][1]).toEqual(mockMovie)
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
    expect(useWatchedStore.getState().seriesData['user1'][10]).toEqual(mockSeries)
  })

  it('does not overwrite an existing series snapshot on subsequent marks', () => {
    useWatchedStore.getState().toggleEpisode('user1', 10, 101, 1, mockSeries)
    const updated = { ...mockSeries, name: 'Updated Name' }
    useWatchedStore.getState().toggleEpisode('user1', 10, 102, 1, updated)
    expect(useWatchedStore.getState().seriesData['user1'][10].name).toBe('Test Series')
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
