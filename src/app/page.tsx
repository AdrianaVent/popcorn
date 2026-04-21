'use client'

import { useState, useEffect } from 'react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import Text from '@/components/ui/Text'
import { useTranslation } from 'react-i18next'
import { colors } from '@/styles/theme'
import ThemeSwitcher from '@/components/common/ThemeSwitcher'

type AuthState = 'idle' | 'loading' | 'logged_in' | 'error'

export default function Home() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [responseCode, setResponseCode] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  const handleLogin = async () => {
    setAuthState('loading')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'emilys', password: 'emilyspass' }),
    })
    const data = await res.json()
    setResponseCode(data.code)
    setAuthState(res.ok ? 'logged_in' : 'error')
  }

  const handleLoginFail = async () => {
    setAuthState('loading')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong', password: 'wrong' }),
    })
    const data = await res.json()
    setResponseCode(data.code)
    setAuthState('error')
  }

  const handleRefresh = async () => {
    setAuthState('loading')
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    const data = await res.json()
    setResponseCode(data.code)
    setAuthState(res.ok ? 'logged_in' : 'error')
  }

  const handleLogout = async () => {
    setAuthState('loading')
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    const data = await res.json()
    setResponseCode(data.code)
    setAuthState('idle')
  }

  const getTranslatedCode = (code: string) => {
    const key = `auth.errors.${code}`
    const successKey = `auth.success.${code}`
    const translated = t(key)
    if (translated !== key) return translated
    const translatedSuccess = t(successKey)
    if (translatedSuccess !== successKey) return translatedSuccess
    return code
  }

  if (!mounted) return null

  return (
    <main style={{ padding: '2rem', maxWidth: '30rem' }}>
      <Text variant="title">Popcorn Dashboard</Text>
      <Text variant="body">Welcome to the platform</Text>
      <Text variant="caption" color={colors.yellow[500]}>
        {t('greeting')}
      </Text>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <hr style={{ margin: '1.5rem 0', opacity: 0.2 }} />

      <Text variant="subtitle">Auth demo</Text>
      <div style={{ marginBottom: '1rem' }}>
        <Text variant="caption" color={colors.yellow[500]}>
          Test credentials: emilys / emilyspass
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button onClick={handleLogin} disabled={authState === 'loading'}>
          Login (valid credentials)
        </button>
        <button onClick={handleLoginFail} disabled={authState === 'loading'}>
          Login (invalid credentials)
        </button>
        <button onClick={handleRefresh} disabled={authState !== 'logged_in'}>
          Refresh token
        </button>
        <button onClick={handleLogout} disabled={authState !== 'logged_in'}>
          Logout
        </button>
      </div>

      {responseCode && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: `0.0625rem solid ${authState === 'error' ? colors.red[400] : colors.green[400]}`,
          background: authState === 'error' ? colors.red[100] : colors.green[100],
        }}>
          <Text variant="caption" color={authState === 'error' ? colors.red[600] : colors.green[600]}>
            code: <strong>{responseCode}</strong>
          </Text>
          <br />
          <Text variant="body" color={authState === 'error' ? colors.red[700] : colors.green[700]}>
            {getTranslatedCode(responseCode)}
          </Text>
        </div>
      )}
    </main>
  )
}
