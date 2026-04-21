'use client' // required by next

import LanguageSwitcher from '@/components/languageSwitcher'
import ThemeSwitcher from '@/components/themeSwitcher'
import Text from '@/components/text'
import { useTranslation } from 'react-i18next'
import { colors } from '@/styles/theme'

export default function Home() {
  const { t } = useTranslation()
  return (
    <main style={{ padding: '2rem' }}>
      <Text variant="title">Popcorn Dashboard</Text>
      <Text variant="body">Welcome to the platform</Text>
      <Text variant="caption" color={colors.yellow[500]}>
        Last update in few moments
      </Text>
      
      <p style={{ marginBottom: '1rem' }}>
       {t('greeting')}
      </p>
      
      <ThemeSwitcher />
      <LanguageSwitcher />
    </main>
  )
}
