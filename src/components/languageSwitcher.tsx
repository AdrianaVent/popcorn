import { useTranslation } from '@/hooks/useTranslation'
import { useLanguageStore } from '@/store/languageStore'

export default function LanguageSwitcher() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()
  const languageNames = { en: 'English', es: 'Español' }

  const toggleLanguage = () => setLanguage(language === 'en' ? 'es' : 'en')

  return <button onClick={toggleLanguage} style={{
        padding: '0.5rem 1rem',
        margin: '1rem',
        cursor: 'pointer',
      }}>
    {t('languageSwitcher.label', { language: languageNames[language] })}
  </button>
}