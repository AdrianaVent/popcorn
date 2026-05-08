import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/config/i18n'

export type Language = 'en' | 'es'

interface LanguageState {
  language: Language
  userLanguages: Record<string, Language>
  setLanguage: (lang: Language, userId?: string) => void
  applyUserLanguage: (userId: string | null) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'es',
      userLanguages: {},
      setLanguage: (lang, userId) => {
        i18n.changeLanguage(lang)
        set((state) => ({
          language: lang,
          userLanguages: userId
            ? { ...state.userLanguages, [userId]: lang }
            : state.userLanguages,
        }))
      },
      applyUserLanguage: (userId) => {
        const lang = userId ? (get().userLanguages[userId] ?? 'es') : 'es'
        i18n.changeLanguage(lang)
        set({ language: lang })
      },
    }),
    { name: 'popcorn-language' }
  )
)
