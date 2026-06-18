import type { ThemeMode } from './types'

export function resolveMode(mode: ThemeMode): 'light' | 'dark' | 'high-contrast' {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  if (mode === 'high-contrast') return 'high-contrast'

  const hour = new Date().getHours()
  return hour >= 7 && hour < 19 ? 'light' : 'dark'
}
