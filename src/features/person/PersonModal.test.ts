import { mergeCredits, getYear, calcAge } from './PersonModal'
import type { TMDBPersonCombinedCredit } from '@/types/tmdb'

const makeCredit = (overrides: Partial<TMDBPersonCombinedCredit>): TMDBPersonCombinedCredit => ({
  id: 1,
  media_type: 'movie',
  poster_path: null,
  vote_average: 7,
  vote_count: 500,
  genre_ids: [],
  original_language: 'en',
  ...overrides,
})

describe('mergeCredits', () => {
  it('returns empty array when both cast and crew are empty', () => {
    expect(mergeCredits([], [])).toEqual([])
  })

  it('maps cast credits with role from character', () => {
    const cast = [makeCredit({ id: 1, character: 'Hero' })]
    const result = mergeCredits(cast, [])
    expect(result[0].role).toBe('Hero')
  })

  it('maps crew credits with role from job', () => {
    const crew = [makeCredit({ id: 2, job: 'Director' })]
    const result = mergeCredits([], crew)
    expect(result[0].role).toBe('Director')
  })

  it('cast takes priority over crew for the same id', () => {
    const cast = [makeCredit({ id: 1, character: 'Hero' })]
    const crew = [makeCredit({ id: 1, job: 'Director' })]
    const result = mergeCredits(cast, crew)
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('Hero')
  })

  it('includes crew entry when id not in cast', () => {
    const cast = [makeCredit({ id: 1, character: 'Hero' })]
    const crew = [makeCredit({ id: 2, job: 'Director' })]
    const result = mergeCredits(cast, crew)
    expect(result).toHaveLength(2)
  })

  it('sorts by date descending (release_date)', () => {
    const cast = [
      makeCredit({ id: 1, release_date: '2010-01-01' }),
      makeCredit({ id: 2, release_date: '2020-01-01' }),
    ]
    const result = mergeCredits(cast, [])
    expect(result[0].id).toBe(2)
    expect(result[1].id).toBe(1)
  })

  it('sorts by first_air_date descending for tv credits', () => {
    const cast = [
      makeCredit({ id: 1, media_type: 'tv', first_air_date: '2015-01-01' }),
      makeCredit({ id: 2, media_type: 'tv', first_air_date: '2022-01-01' }),
    ]
    const result = mergeCredits(cast, [])
    expect(result[0].id).toBe(2)
  })

  it('credits with no date sort after dated credits', () => {
    const cast = [
      makeCredit({ id: 1, release_date: '2020-01-01' }),
      makeCredit({ id: 2 }),
    ]
    const result = mergeCredits(cast, [])
    expect(result[0].id).toBe(1)
  })

  it('uses empty string as role when character and job are both absent', () => {
    const cast = [makeCredit({ id: 1, character: undefined })]
    const result = mergeCredits(cast, [])
    expect(result[0].role).toBe('')
  })
})

describe('calcAge', () => {
  it('returns correct age when birthday has passed this year', () => {
    expect(calcAge('1980-01-01', '2024-06-15')).toBe(44)
  })

  it('returns correct age when birthday has not passed this year', () => {
    expect(calcAge('1980-12-31', '2024-06-15')).toBe(43)
  })

  it('returns correct age on the exact birthday', () => {
    expect(calcAge('1980-06-15', '2024-06-15')).toBe(44)
  })

  it('computes age at death when referenceDate is deathday', () => {
    expect(calcAge('1926-06-01', '1962-08-04')).toBe(36)
  })

  it('returns 0 for same birth and reference date', () => {
    expect(calcAge('2000-01-01', '2000-01-01')).toBe(0)
  })
})

describe('getYear', () => {
  it('returns year from release_date', () => {
    expect(getYear(makeCredit({ release_date: '2010-07-16' }))).toBe('2010')
  })

  it('returns year from first_air_date when release_date is absent', () => {
    expect(getYear(makeCredit({ media_type: 'tv', first_air_date: '2022-03-05' }))).toBe('2022')
  })

  it('returns em dash when no date is available', () => {
    expect(getYear(makeCredit({}))).toBe('—')
  })

  it('prefers release_date over first_air_date', () => {
    expect(getYear(makeCredit({ release_date: '2010-01-01', first_air_date: '2022-01-01' }))).toBe('2010')
  })
})
