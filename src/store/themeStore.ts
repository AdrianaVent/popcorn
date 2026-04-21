import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resolveTheme } from '@/styles/theme'
import type { ThemeMode } from '@/styles/theme'

interface ThemeState {
  mode: ThemeMode
  theme: ReturnType<typeof resolveTheme>
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'auto',
      theme: resolveTheme('auto'),
      setMode: (mode: ThemeMode) =>
        set({
          mode,
          theme: resolveTheme(mode),
        }),
    }),
    {
      name: 'popcorn-theme',
      partialize: (state) => ({ mode: state.mode }),
      merge: (persisted, current) => {
        const mode = (persisted as { mode: ThemeMode }).mode ?? current.mode
        return { ...current, mode, theme: resolveTheme(mode) }
      },
    }
  )
)
