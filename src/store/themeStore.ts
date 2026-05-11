import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'
import type { ThemeMode } from '@/styles/theme'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'auto',
      setMode: (mode: ThemeMode) => set({ mode }),
    }),
    {
      name: 'popcorn-theme',
      storage: ssrStorage,
    }
  )
)
