'use client' // required by Zustand

import { type ReactNode, useEffect } from 'react'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'

interface LanguageProviderProps {
  children: ReactNode
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const applyUserLanguage = useLanguageStore((s) => s.applyUserLanguage)
  const userId = useUserStore((s) => s.userId)

  useEffect(() => {
    applyUserLanguage(userId)
  }, [userId, applyUserLanguage])

  return <>{children}</>
}
