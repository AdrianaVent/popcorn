'use client' // required by Zustand

import { type ReactNode, useEffect } from 'react'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'

interface LanguageProviderProps {
  children: ReactNode
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const applyUserLanguage    = useLanguageStore((s) => s.applyUserLanguage)
  const userId               = useUserStore((s) => s.userId)
  const purgeUpcomingMovies  = useWatchedStore((s) => s.purgeUpcomingMovies)
  const purgeUpcomingSeries  = useWatchedStore((s) => s.purgeUpcomingSeries)

  useEffect(() => {
    applyUserLanguage(userId)
    if (userId) {
      purgeUpcomingMovies(String(userId))
      purgeUpcomingSeries(String(userId))
    }
  }, [userId, applyUserLanguage, purgeUpcomingMovies, purgeUpcomingSeries])

  return <>{children}</>
}
