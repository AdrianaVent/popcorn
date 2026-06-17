import type { Rating } from '@/store/ratingsStore'
import type { StoredMovie, StoredSeries } from '@/store/watchedStore'
import type { ChartEntry, Period } from './statsCard.types'
import { DAY_MS, WEEK_MS } from './statsCard.types'

const RATING_STEPS: Rating[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

const DECADES = [
  { label: '< 1980',  from: 0,    to: 1980 },
  { label: '1980–89', from: 1980, to: 1990 },
  { label: '1990–99', from: 1990, to: 2000 },
  { label: '2000–09', from: 2000, to: 2010 },
  { label: '2010–19', from: 2010, to: 2020 },
  { label: '2020–',   from: 2020, to: 2030 },
]

export function buildRatingHistogram(
  movieRatings: Record<number, Rating>,
  seriesRatings: Record<number, Rating>,
): ChartEntry[] {
  const counts = Object.fromEntries(RATING_STEPS.map((r) => [r, 0])) as Record<number, number>
  for (const r of Object.values(movieRatings))  counts[r]++
  for (const r of Object.values(seriesRatings)) counts[r]++
  return RATING_STEPS.map((r) => ({ name: `${r}★`, count: counts[r] }))
}

export function buildDecadeDistribution(
  movies: Pick<StoredMovie, 'release_date'>[],
  series: Pick<StoredSeries, 'first_air_date'>[],
): ChartEntry[] {
  const counts = DECADES.map(() => 0)
  const addYear = (year: number) => {
    const idx = DECADES.findIndex((d) => year >= d.from && year < d.to)
    if (idx >= 0) counts[idx]++
  }
  for (const m of movies) { if (m.release_date)   addYear(parseInt(m.release_date.slice(0, 4))) }
  for (const s of series)  { if (s.first_air_date) addYear(parseInt(s.first_air_date.slice(0, 4))) }
  const result = DECADES.map((d, i) => ({ name: d.label, count: counts[i] }))
  const first = result.findIndex((d) => d.count > 0)
  return first >= 0 ? result.slice(first) : []
}

export function getLast6MonthBuckets(locale: string) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      name:  d.toLocaleDateString(locale, { month: 'short' }),
      start: d.getTime(),
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
    }
  })
}

export function getLast6Buckets(period: Exclude<Period, 'monthly'>, locale: string) {
  const unitMs = period === 'weekly' ? WEEK_MS : DAY_MS
  const t0 = new Date(); t0.setDate(t0.getDate() + 1); t0.setHours(0, 0, 0, 0)
  const base = t0.getTime()
  return Array.from({ length: 6 }, (_, i) => {
    const end = base - (5 - i) * unitMs; const start = end - unitMs
    return { name: new Date(start).toLocaleDateString(locale, { day: 'numeric', month: 'short' }), start, end }
  })
}
