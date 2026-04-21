'use client' // required by Zustand

import { useThemeStore } from '@/store/themeStore'

export default function ThemeSwitcher() {
  const { mode, setMode } = useThemeStore()

  return (
    <button
      onClick={() => {
        if (mode === 'light') setMode('dark')
        else if (mode === 'dark') setMode('auto')
        else setMode('light')
      }}
      style={{
        padding: '0.5rem 1rem',
        margin: '1rem',
        cursor: 'pointer',
      }}
    >
      Current mode: {mode}
    </button>
  )
}
