import { formatVoteCount } from './formatNumber'

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
