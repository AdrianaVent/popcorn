import { formatVoteCount, tmdbToStarRating, formatRuntime } from './formatNumber'

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

describe('formatRuntime', () => {
  describe('Spanish (default) — minutes unit is "min"', () => {
    it('formats minutes below 60 as "X min"', () => {
      expect(formatRuntime(45)).toBe('45 min')
      expect(formatRuntime(59)).toBe('59 min')
    })

    it('formats exactly 60 min as "1h"', () => {
      expect(formatRuntime(60)).toBe('1h')
    })

    it('formats hours with no remainder', () => {
      expect(formatRuntime(120)).toBe('2h')
    })

    it('formats hours and minutes', () => {
      expect(formatRuntime(90)).toBe('1h 30min')
      expect(formatRuntime(127)).toBe('2h 7min')
    })

    it('formats exactly 24h as "1d"', () => {
      expect(formatRuntime(1440)).toBe('1d')
    })

    it('formats days with remaining hours', () => {
      expect(formatRuntime(1500)).toBe('1d 1h')
      expect(formatRuntime(2974)).toBe('2d 1h')
    })

    it('omits hours when day remainder is less than 60 min', () => {
      expect(formatRuntime(2880)).toBe('2d')
      expect(formatRuntime(2914)).toBe('2d') // 62ep × 47min = 2d 34min
    })
  })

  describe('English — minutes unit is "m"', () => {
    it('formats minutes below 60 as "X m"', () => {
      expect(formatRuntime(45, 'en')).toBe('45 m')
    })

    it('formats hours and minutes', () => {
      expect(formatRuntime(90, 'en')).toBe('1h 30m')
      expect(formatRuntime(127, 'en')).toBe('2h 7m')
    })

    it('formats days (no minutes unit involved)', () => {
      expect(formatRuntime(1500, 'en')).toBe('1d 1h')
      expect(formatRuntime(2880, 'en')).toBe('2d')
    })
  })
})
