'use client' // required by Zustand

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ThemeProvider from './ThemeProvider.client'
import LanguageProvider from './LanguageProvider.client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — TMDB data doesn't change frequently
      retry: 1,
    },
  },
})

interface GlobalProviderProps {
  children: ReactNode;
}

export default function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
