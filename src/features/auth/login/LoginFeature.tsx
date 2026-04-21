'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/themeStore'
import { colors } from '@/styles/theme'
import { useLogin } from './useLogin'
import LoginForm from './LoginForm'

export default function LoginFeature() {
  const { t } = useTranslation()
  const { theme } = useThemeStore()
  const { form, loading, errorMessage, fieldErrors, handleChange, handleSubmit } = useLogin()

  return (
    <>
      {/* Retro header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <Image src="/icons/popcorn.svg" alt="Popcorn" width={340} height={136} loading="eager" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
          <div style={{ flex: 1, height: '0.0625rem', background: colors.yellow[500], opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.15em', color: theme.textSecondary, whiteSpace: 'nowrap' }}>
            ✦ POP. WATCH. REPEAT. ✦
          </p>
          <div style={{ flex: 1, height: '0.0625rem', background: colors.yellow[500], opacity: 0.6 }} />
        </div>
      </div>

      {/* Subtitle */}
      <p style={{ margin: 0, fontSize: '0.8rem', color: theme.textSecondary, textAlign: 'center', letterSpacing: '0.02em' }}>
        {t('login.subtitle')}
      </p>

      {/* Form */}
      <LoginForm
        form={form}
        loading={loading}
        errorMessage={errorMessage}
        fieldErrors={fieldErrors}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </>
  )
}
