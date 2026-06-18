import { getLast6Buckets, getLast6MonthBuckets } from './statsCard.utils'
import { DAY_MS, WEEK_MS } from './statsCard.types'

describe('getLast6MonthBuckets', () => {
  it('returns exactly 6 buckets', () => {
    expect(getLast6MonthBuckets('en-US')).toHaveLength(6)
  })

  it('buckets are in chronological order', () => {
    const buckets = getLast6MonthBuckets('en-US')
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].start).toBeGreaterThan(buckets[i - 1].start)
    }
  })

  it('consecutive buckets are contiguous (end of one === start of next)', () => {
    const buckets = getLast6MonthBuckets('en-US')
    for (let i = 0; i < buckets.length - 1; i++) {
      expect(buckets[i].end).toBe(buckets[i + 1].start)
    }
  })

  it('each key is formatted as YYYY-MM', () => {
    const buckets = getLast6MonthBuckets('en-US')
    for (const b of buckets) {
      expect(b.key).toMatch(/^\d{4}-\d{2}$/)
    }
  })

  it('key matches the year-month of the bucket start date', () => {
    const buckets = getLast6MonthBuckets('en-US')
    for (const b of buckets) {
      const d = new Date(b.start)
      const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      expect(b.key).toBe(expected)
    }
  })

  it('each bucket spans exactly one calendar month', () => {
    const buckets = getLast6MonthBuckets('en-US')
    for (const b of buckets) {
      const start = new Date(b.start)
      const end   = new Date(b.end)
      expect(end.getDate()).toBe(1)
      expect(end.getHours()).toBe(0)
      expect(
        end.getMonth() === (start.getMonth() + 1) % 12 ||
        (end.getMonth() === 0 && start.getMonth() === 11)
      ).toBe(true)
    }
  })
})

describe('getLast6Buckets — weekly', () => {
  it('returns exactly 6 buckets', () => {
    expect(getLast6Buckets('weekly', 'en-US')).toHaveLength(6)
  })

  it('each bucket spans exactly one week', () => {
    const buckets = getLast6Buckets('weekly', 'en-US')
    for (const b of buckets) {
      expect(b.end - b.start).toBe(WEEK_MS)
    }
  })

  it('buckets are in chronological order', () => {
    const buckets = getLast6Buckets('weekly', 'en-US')
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].start).toBeGreaterThan(buckets[i - 1].start)
    }
  })

  it('consecutive buckets are contiguous', () => {
    const buckets = getLast6Buckets('weekly', 'en-US')
    for (let i = 0; i < buckets.length - 1; i++) {
      expect(buckets[i].end).toBe(buckets[i + 1].start)
    }
  })

  it('last bucket ends at tomorrow midnight', () => {
    const buckets = getLast6Buckets('weekly', 'en-US')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    expect(buckets[buckets.length - 1].end).toBe(tomorrow.getTime())
  })
})

describe('getLast6Buckets — daily', () => {
  it('returns exactly 6 buckets', () => {
    expect(getLast6Buckets('daily', 'en-US')).toHaveLength(6)
  })

  it('each bucket spans exactly one day', () => {
    const buckets = getLast6Buckets('daily', 'en-US')
    for (const b of buckets) {
      expect(b.end - b.start).toBe(DAY_MS)
    }
  })

  it('daily spans are shorter than weekly spans', () => {
    const daily  = getLast6Buckets('daily', 'en-US')
    const weekly = getLast6Buckets('weekly', 'en-US')
    expect(daily[0].end - daily[0].start).toBeLessThan(weekly[0].end - weekly[0].start)
  })

  it('consecutive buckets are contiguous', () => {
    const buckets = getLast6Buckets('daily', 'en-US')
    for (let i = 0; i < buckets.length - 1; i++) {
      expect(buckets[i].end).toBe(buckets[i + 1].start)
    }
  })
})
