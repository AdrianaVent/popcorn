import type { ThemeMode } from './types'

export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'

  const hour = new Date().getHours()
  return hour >= 7 && hour < 19 ? 'light' : 'dark'
}
