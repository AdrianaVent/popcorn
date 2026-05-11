'use client' // required by Zustand

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'es'
  try {
    const userRaw = localStorage.getItem('popcorn-user')
    const userId = JSON.parse(userRaw ?? '')?.state?.userId as string | null

    const langRaw = localStorage.getItem('popcorn-language')
    const langState = JSON.parse(langRaw ?? '')?.state

    if (userId && langState?.userLanguages?.[userId]) {
      return langState.userLanguages[userId]
    }
    // Fallback: stored global language (old format) or default Spanish
    return langState?.language ?? 'es'
  } catch {
    return 'es'
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })

export default i18n
