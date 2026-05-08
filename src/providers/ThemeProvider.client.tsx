'use client'

import { ReactNode, useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { resolveMode } from '@/styles/theme'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeStore()
  const resolved = resolveMode(mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {children}
    </div>
  )
}
