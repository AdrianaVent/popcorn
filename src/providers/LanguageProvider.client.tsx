'use client' // required by Zustand

import { ReactNode, useEffect } from 'react'
import { useLanguageStore } from '@/store/languageStore'

interface LanguageProviderProps {
  children: ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const { setLanguage } = useLanguageStore()

  useEffect(() => {
    const initialized = localStorage.getItem('popcorn-lang-init')
    if (!initialized) {
      const browserLang = navigator.language.startsWith('es') ? 'es' : 'en'
      setLanguage(browserLang)
      localStorage.setItem('popcorn-lang-init', '1')
    }
  }, [setLanguage])

  return <>{children}</>
}
