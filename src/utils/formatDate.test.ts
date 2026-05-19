import { formatShortDate } from './formatDate'

describe('formatShortDate', () => {
  it('formats a date in English', () => {
    expect(formatShortDate('2010-07-16', 'en')).toBe('Jul 16, 2010')
  })

  it('formats a date in Spanish', () => {
    expect(formatShortDate('2010-07-16', 'es')).toBe('16 jul 2010')
  })

  it('pads single-digit day with a leading zero in Spanish', () => {
    expect(formatShortDate('2010-01-05', 'es')).toBe('05 ene 2010')
  })

  it('does not pad day in English', () => {
    expect(formatShortDate('2010-01-05', 'en')).toBe('Jan 5, 2010')
  })

  it('uses UTC to avoid timezone drift on day 1 of month', () => {
    expect(formatShortDate('2010-01-01', 'en')).toBe('Jan 1, 2010')
  })
})
