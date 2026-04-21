import { lightTheme } from './light'
import { darkTheme } from './dark'
import type { ThemeMode } from './types'

export function resolveTheme(mode: ThemeMode) {
  if (mode === 'light') return lightTheme
  if (mode === 'dark') return darkTheme

  // auto → depending on the system time
  const hour = new Date().getHours()
  return hour >= 7 && hour < 19 ? lightTheme : darkTheme
}
