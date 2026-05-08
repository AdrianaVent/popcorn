'use client' // required by Zustand

import { ReactNode, useEffect } from 'react'
import i18n from '@/config/i18n'
import { useLanguageStore } from '@/store/languageStore'

interface LanguageProviderProps {
  children: ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const { language, setLanguage } = useLanguageStore()

  useEffect(() => {
    // Sync i18n after mount so server and client hydrate with the same language ('en'),
    // then update to the persisted language on the client.
    i18n.changeLanguage(language)
  }, [language])

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
