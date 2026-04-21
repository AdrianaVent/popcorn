import { useTranslation } from '@/hooks/useTranslation'
import { useLanguageStore } from '@/store/languageStore'
import Button from '@/components/ui/Button'

export default function LanguageSwitcher() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguageStore()

  const languageNames = {
    en: 'English',
    es: 'Español',
  }

  const toggleLanguage = () =>
    setLanguage(language === 'en' ? 'es' : 'en')

  return (
    <Button onClick={toggleLanguage} variant="secondary">
      {t('languageSwitcher.label', {
        language: languageNames[language],
      })}
    </Button>
  )
}