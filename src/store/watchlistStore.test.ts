import { useWatchlistStore } from './watchlistStore'
import type { WatchlistMovie, WatchlistSeries } from './watchlistStore'

const mockMovie: WatchlistMovie = {
  id: 1,
  title: 'Test Movie',
  release_date: '2026-06-05',
  poster_path: null,
  vote_average: 0,
  vote_count: 0,
  original_language: 'es',
  addedAt: 0,
}

const mockSeries: WatchlistSeries = {
  id: 10,
  name: 'Test Series',
  first_air_date: '2026-06-05',
  poster_path: null,
  vote_average: 0,
  vote_count: 0,
  original_language: 'es',
  addedAt: 0,
}

beforeEach(() => {
  useWatchlistStore.setState({ movies: {}, series: {} })
})

describe('toggleMovie', () => {
  it('adds a movie when not in watchlist', () => {
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    expect(useWatchlistStore.getState().movies['u1'][1]).toEqual(expect.objectContaining({ id: 1, title: 'Test Movie' }))
  })

  it('sets addedAt on add', () => {
    const before = Date.now()
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    expect(useWatchlistStore.getState().movies['u1'][1].addedAt).toBeGreaterThanOrEqual(before)
  })

  it('removes the movie on second toggle', () => {
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    expect(useWatchlistStore.getState().movies['u1']?.[1]).toBeUndefined()
  })

  it('isolates data between users', () => {
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    expect(useWatchlistStore.getState().movies['u2']?.[1]).toBeUndefined()
  })
})

describe('toggleSeries', () => {
  it('adds a series when not in watchlist', () => {
    useWatchlistStore.getState().toggleSeries('u1', mockSeries)
    expect(useWatchlistStore.getState().series['u1'][10]).toEqual(expect.objectContaining({ id: 10, name: 'Test Series' }))
  })

  it('sets addedAt on add', () => {
    const before = Date.now()
    useWatchlistStore.getState().toggleSeries('u1', mockSeries)
    expect(useWatchlistStore.getState().series['u1'][10].addedAt).toBeGreaterThanOrEqual(before)
  })

  it('removes the series on second toggle', () => {
    useWatchlistStore.getState().toggleSeries('u1', mockSeries)
    useWatchlistStore.getState().toggleSeries('u1', mockSeries)
    expect(useWatchlistStore.getState().series['u1']?.[10]).toBeUndefined()
  })

  it('isolates data between users', () => {
    useWatchlistStore.getState().toggleSeries('u1', mockSeries)
    expect(useWatchlistStore.getState().series['u2']?.[10]).toBeUndefined()
  })
})

describe('removeMovie', () => {
  it('removes an existing movie', () => {
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    useWatchlistStore.getState().removeMovie('u1', 1)
    expect(useWatchlistStore.getState().movies['u1']?.[1]).toBeUndefined()
  })

  it('is a no-op when the movie is not in the list', () => {
    expect(() => useWatchlistStore.getState().removeMovie('u1', 99)).not.toThrow()
  })

  it('does not remove other movies', () => {
    const other: WatchlistMovie = { ...mockMovie, id: 2, title: 'Other' }
    useWatchlistStore.getState().toggleMovie('u1', mockMovie)
    useWatchlistStore.getState().toggleMovie('u1', other)
    useWatchlistStore.getState().removeMovie('u1', 1)
    expect(useWatchlistStore.getState().movies['u1'][2]).toBeDefined()
  })
})

describe('removeSeries', () => {
  it('removes an existing series', () => {
    useWatchlistStore.getState().toggleSeries('u1', mockSeries)
    useWatchlistStore.getState().removeSeries('u1', 10)
    expect(useWatchlistStore.getState().series['u1']?.[10]).toBeUndefined()
  })

  it('is a no-op when the series is not in the list', () => {
    expect(() => useWatchlistStore.getState().removeSeries('u1', 99)).not.toThrow()
  })
})
