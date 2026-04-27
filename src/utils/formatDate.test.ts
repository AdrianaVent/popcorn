import { formatShortDate } from './formatDate'

describe('formatShortDate', () => {
  it('formats a date in English', () => {
    expect(formatShortDate('2010-07-16', 'en')).toBe('16 Jul 2010')
  })

  it('formats a date in Spanish', () => {
    expect(formatShortDate('2010-07-16', 'es')).toBe('16 jul 2010')
  })

  it('pads single-digit day with a leading zero', () => {
    expect(formatShortDate('2010-01-05', 'en')).toBe('05 Jan 2010')
  })

  it('uses UTC to avoid timezone drift on day 1 of month', () => {
    expect(formatShortDate('2010-01-01', 'en')).toBe('01 Jan 2010')
  })
})
