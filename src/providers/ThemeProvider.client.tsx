'use client' // required by Zustand

import { ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  const { theme } = useThemeStore()

  return (
    <div
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        minHeight: '100vh',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      {children}
    </div>
  )
}
