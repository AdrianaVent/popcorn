import { useRatingsStore } from './ratingsStore'

beforeEach(() => {
  useRatingsStore.setState({ ratings: {} })
})

describe('setRating', () => {
  it('sets a movie rating for a user', () => {
    useRatingsStore.getState().setRating('user1', 'movie', 1, 4)
    expect(useRatingsStore.getState().ratings['user1'].movies[1]).toBe(4)
  })

  it('sets a series rating for a user', () => {
    useRatingsStore.getState().setRating('user1', 'series', 10, 3.5)
    expect(useRatingsStore.getState().ratings['user1'].series[10]).toBe(3.5)
  })

  it('creates user entry if it does not exist', () => {
    useRatingsStore.getState().setRating('newuser', 'movie', 5, 2)
    expect(useRatingsStore.getState().ratings['newuser'].movies[5]).toBe(2)
  })

  it('overwrites an existing rating', () => {
    useRatingsStore.getState().setRating('user1', 'movie', 1, 3)
    useRatingsStore.getState().setRating('user1', 'movie', 1, 5)
    expect(useRatingsStore.getState().ratings['user1'].movies[1]).toBe(5)
  })

  it('keeps ratings for different users isolated', () => {
    useRatingsStore.getState().setRating('user1', 'movie', 1, 4)
    useRatingsStore.getState().setRating('user2', 'movie', 1, 2)
    expect(useRatingsStore.getState().ratings['user1'].movies[1]).toBe(4)
    expect(useRatingsStore.getState().ratings['user2'].movies[1]).toBe(2)
  })

  it('does not overwrite ratings of other types', () => {
    useRatingsStore.getState().setRating('user1', 'movie', 1, 4)
    useRatingsStore.getState().setRating('user1', 'series', 1, 3)
    expect(useRatingsStore.getState().ratings['user1'].movies[1]).toBe(4)
    expect(useRatingsStore.getState().ratings['user1'].series[1]).toBe(3)
  })
})

describe('removeRating', () => {
  it('removes a movie rating', () => {
    useRatingsStore.getState().setRating('user1', 'movie', 1, 4)
    useRatingsStore.getState().removeRating('user1', 'movie', 1)
    expect(useRatingsStore.getState().ratings['user1'].movies[1]).toBeUndefined()
  })

  it('removes a series rating', () => {
    useRatingsStore.getState().setRating('user1', 'series', 10, 3.5)
    useRatingsStore.getState().removeRating('user1', 'series', 10)
    expect(useRatingsStore.getState().ratings['user1'].series[10]).toBeUndefined()
  })

  it('does nothing when user does not exist', () => {
    expect(() => useRatingsStore.getState().removeRating('ghost', 'movie', 1)).not.toThrow()
  })

  it('does not affect other ratings when removing one', () => {
    useRatingsStore.getState().setRating('user1', 'movie', 1, 4)
    useRatingsStore.getState().setRating('user1', 'movie', 2, 3)
    useRatingsStore.getState().removeRating('user1', 'movie', 1)
    expect(useRatingsStore.getState().ratings['user1'].movies[2]).toBe(3)
  })
})
