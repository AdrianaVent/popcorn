'use client' // required by Zustand

import { ReactNode, useEffect } from 'react'
import { useLanguageStore } from '@/store/languageStore'
import i18n from '@/config/i18n'

interface LanguageProviderProps {
  children: ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const { language, setLanguage } = useLanguageStore()

  useEffect(() => {
    // Detect browser language if there is no persistence
    if (!language) {
      const browserLang = navigator.language.startsWith('es') ? 'es' : 'en'
      setLanguage(browserLang)
    } else {
      i18n.changeLanguage(language)
    }
  }, [language, setLanguage])

  return <>{children}</>
}
