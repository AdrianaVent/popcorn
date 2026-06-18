export type ChartEntry = { name: string; count: number }
export type Period     = 'daily' | 'weekly' | 'monthly'
export type StatTab    = 'activity' | 'insights'
export type UserStats  = {
  total: number; guests: number; admins: number; thisMonth: number
  byMonth: { month: string; count: number }[]
  byWeek:  { start: number; count: number }[]
  byDay:   { start: number; count: number }[]
}

export const DAY_MS  = 86_400_000
export const WEEK_MS = 7 * DAY_MS
