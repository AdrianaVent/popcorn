import { resolveMode } from './resolveTheme'

describe('resolveMode', () => {
  it('returns light when mode is "light"', () => {
    expect(resolveMode('light')).toBe('light')
  })

  it('returns dark when mode is "dark"', () => {
    expect(resolveMode('dark')).toBe('dark')
  })

  describe('auto mode', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('returns light at 7:00 (start of day)', () => {
      jest.setSystemTime(new Date('2024-01-01T07:00:00'))
      expect(resolveMode('auto')).toBe('light')
    })

    it('returns light at midday', () => {
      jest.setSystemTime(new Date('2024-01-01T12:00:00'))
      expect(resolveMode('auto')).toBe('light')
    })

    it('returns light at 18:59 (last light hour)', () => {
      jest.setSystemTime(new Date('2024-01-01T18:59:00'))
      expect(resolveMode('auto')).toBe('light')
    })

    it('returns dark at 19:00', () => {
      jest.setSystemTime(new Date('2024-01-01T19:00:00'))
      expect(resolveMode('auto')).toBe('dark')
    })

    it('returns dark at midnight', () => {
      jest.setSystemTime(new Date('2024-01-01T00:00:00'))
      expect(resolveMode('auto')).toBe('dark')
    })

    it('returns dark at 06:59 (just before morning)', () => {
      jest.setSystemTime(new Date('2024-01-01T06:59:00'))
      expect(resolveMode('auto')).toBe('dark')
    })
  })
})
