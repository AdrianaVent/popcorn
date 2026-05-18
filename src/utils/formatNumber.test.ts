import { formatVoteCount, tmdbToStarRating } from './formatNumber'

describe('formatVoteCount', () => {
  describe('Spanish (dot as thousand separator)', () => {
    it('formats 1000 as 1.000', () => {
      expect(formatVoteCount(1000, 'es')).toBe('1.000')
    })

    it('formats 9999 as 9.999', () => {
      expect(formatVoteCount(9999, 'es')).toBe('9.999')
    })

    it('formats 10000 as 10.000', () => {
      expect(formatVoteCount(10000, 'es')).toBe('10.000')
    })

    it('formats 1234567 as 1.234.567', () => {
      expect(formatVoteCount(1234567, 'es')).toBe('1.234.567')
    })
  })

  describe('English (comma as thousand separator)', () => {
    it('formats 1000 as 1,000', () => {
      expect(formatVoteCount(1000, 'en')).toBe('1,000')
    })

    it('formats 9999 as 9,999', () => {
      expect(formatVoteCount(9999, 'en')).toBe('9,999')
    })

    it('formats 10000 as 10,000', () => {
      expect(formatVoteCount(10000, 'en')).toBe('10,000')
    })

    it('formats 1234567 as 1,234,567', () => {
      expect(formatVoteCount(1234567, 'en')).toBe('1,234,567')
    })
  })

  it('leaves numbers below 1000 unchanged', () => {
    expect(formatVoteCount(999, 'es')).toBe('999')
    expect(formatVoteCount(999, 'en')).toBe('999')
  })
})

describe('tmdbToStarRating', () => {
  it('returns null for score 0', () => {
    expect(tmdbToStarRating(0)).toBeNull()
  })

  it('returns null for negative scores', () => {
    expect(tmdbToStarRating(-1)).toBeNull()
  })

  it('converts 10 to 5', () => {
    expect(tmdbToStarRating(10)).toBe(5)
  })

  it('converts 8 to 4', () => {
    expect(tmdbToStarRating(8)).toBe(4)
  })

  it('converts 8.5 to 4.5', () => {
    expect(tmdbToStarRating(8.5)).toBe(4.5)
  })

  it('converts 5 to 2.5', () => {
    expect(tmdbToStarRating(5)).toBe(2.5)
  })

  it('rounds to nearest half-star', () => {
    expect(tmdbToStarRating(7.3)).toBe(3.5) // Math.round(7.3)=7, /2=3.5
    expect(tmdbToStarRating(7.7)).toBe(4)   // Math.round(7.7)=8, /2=4
  })

  it('clamps to 0.5 minimum for very low scores', () => {
    expect(tmdbToStarRating(0.1)).toBe(0.5) // Math.round(0.1)=0, max(0.5,0)=0.5
  })
})
