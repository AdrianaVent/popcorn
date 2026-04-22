'use client'

import { ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { resolveMode } from '@/styles/theme'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeStore()

  return (
    <div data-theme={resolveMode(mode)} className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {children}
    </div>
  )
}
