'use client' // required by Zustand

import { ReactNode } from 'react'
import ThemeProvider from './ThemeProvider.client'
import LanguageProvider from './LanguageProvider.client'

interface GlobalProviderProps {
  children: ReactNode;
}

export default function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  )
}
