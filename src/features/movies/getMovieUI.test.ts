import { getMovieUI } from './getMovieUI'

const FUTURE = '2099-01-01'
const PAST   = '2000-01-01'

describe('getMovieUI', () => {
  it('returns defaults when detail is null', () => {
    expect(getMovieUI(null)).toEqual({ isUpcoming: false, releaseYear: null, resolvedDate: '' })
  })

  it('returns defaults when detail is undefined', () => {
    expect(getMovieUI(undefined)).toEqual({ isUpcoming: false, releaseYear: null, resolvedDate: '' })
  })

  it('returns defaults when release_date is empty', () => {
    // @ts-expect-error — simulating missing release_date
    expect(getMovieUI({ release_date: '' })).toEqual({ isUpcoming: false, releaseYear: null, resolvedDate: '' })
  })

  it('falls back to ES theatrical release_date when primary is empty', () => {
    const detail = {
      release_date: '',
      release_dates: {
        results: [{ iso_3166_1: 'ES', release_dates: [{ release_date: '2026-06-05T00:00:00.000Z', type: 3 }] }],
      },
    }
    // @ts-expect-error — partial detail
    const ui = getMovieUI(detail)
    expect(ui.isUpcoming).toBe(true)
    expect(ui.releaseYear).toBe(2026)
    expect(ui.resolvedDate).toBe('2026-06-05T00:00:00.000Z')
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
