import { getMovieUI } from './getMovieUI'

const FUTURE = '2099-01-01'
const PAST   = '2000-01-01'

describe('getMovieUI', () => {
  it('returns defaults when detail is null', () => {
    expect(getMovieUI(null)).toEqual({ isUpcoming: false, releaseYear: null })
  })

  it('returns defaults when detail is undefined', () => {
    expect(getMovieUI(undefined)).toEqual({ isUpcoming: false, releaseYear: null })
  })

  it('returns defaults when release_date is empty', () => {
    // @ts-expect-error — simulating missing release_date
    expect(getMovieUI({ release_date: '' })).toEqual({ isUpcoming: false, releaseYear: null })
  })

  it('marks a future release as upcoming', () => {
    // @ts-expect-error — partial detail
    expect(getMovieUI({ release_date: FUTURE }).isUpcoming).toBe(true)
  })

  it('marks a past release as not upcoming', () => {
    // @ts-expect-error — partial detail
    expect(getMovieUI({ release_date: PAST }).isUpcoming).toBe(false)
  })

  it('extracts the correct release year', () => {
    // @ts-expect-error — partial detail
    expect(getMovieUI({ release_date: '2023-06-15' }).releaseYear).toBe(2023)
  })
})
