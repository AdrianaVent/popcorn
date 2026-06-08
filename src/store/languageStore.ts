import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'
import i18n from '@/config/i18n'

export type Language = 'en' | 'es'

interface LanguageState {
  language: Language
  userLanguages: Record<string, Language>
  region: string
  userRegions: Record<string, string>
  setLanguage: (lang: Language, userId?: string) => void
  setRegion: (region: string, userId?: string) => void
  applyUserLanguage: (userId: string | null) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'es',
      userLanguages: {},
      region: 'ES',
      userRegions: {},
      setLanguage: (lang, userId) => {
        i18n.changeLanguage(lang)
        set((state) => ({
          language: lang,
          userLanguages: userId
            ? { ...state.userLanguages, [userId]: lang }
            : state.userLanguages,
        }))
      },
      setRegion: (region, userId) => {
        set((state) => ({
          region,
          userRegions: userId
            ? { ...state.userRegions, [userId]: region }
            : state.userRegions,
        }))
      },
      applyUserLanguage: (userId) => {
        const state = get()
        const lang = userId ? (state.userLanguages[userId] ?? state.language) : state.language
        const region = userId ? (state.userRegions[userId] ?? state.region) : state.region
        i18n.changeLanguage(lang)
        set({ language: lang, region })
      },
    }),
    { name: 'popcorn-language', storage: ssrStorage }
  )
)
