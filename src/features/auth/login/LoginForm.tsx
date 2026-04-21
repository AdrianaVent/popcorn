'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import { useThemeStore } from '@/store/themeStore'

type LoginFormProps = {
  form: { email: string; password: string }
  loading: boolean
  errorMessage: string | null
  fieldErrors: { email?: string; password?: string }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function LoginForm({
  form,
  loading,
  errorMessage,
  fieldErrors,
  onChange,
  onSubmit,
}: LoginFormProps) {
  const { t } = useTranslation()
  const { theme } = useThemeStore()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input
        id="email"
        name="email"
        type="text"
        label={t('login.email')}
        value={form.email}
        onChange={onChange}
        autoComplete="username"
        error={fieldErrors.email}
      />
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label={t('login.password')}
        value={form.password}
        onChange={onChange}
        autoComplete="current-password"
        error={fieldErrors.password}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: theme.textSecondary,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon visible={showPassword} />
          </button>
        }
      />
      {errorMessage && (
        <Text variant="caption" color={theme.error}>
          {errorMessage}
        </Text>
      )}
      <Button type="submit" loading={loading}>
        {loading ? t('login.loading') : t('login.submit')}
      </Button>
    </form>
  )
}
