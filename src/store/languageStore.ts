import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/config/i18n'

export type Language = 'en' | 'es';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang: Language) => {
        i18n.changeLanguage(lang)
        set({ language: lang })
      },
    }),
    {
      name: 'popcorn-language',
      // onRehydrateStorage fires after Zustand restores state from localStorage.
      // Without this, i18n would stay on its default language until the next
      // setLanguage call, causing a flash of untranslated text on page reload.
      onRehydrateStorage: () => (state) => {
        if (state?.language) i18n.changeLanguage(state.language)
      },
    }
  )
)
