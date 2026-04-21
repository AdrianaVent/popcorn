'use client'

import { ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { colors } from '@/styles/theme'

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme } = useThemeStore()
  const isDark = theme.mode === 'dark'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url(\'/icons/favicon-32x32.png\')',
          backgroundRepeat: 'repeat',
          backgroundSize: '3.25rem 3.25rem',
          opacity: isDark ? 0.15 : 0.08,
          pointerEvents: 'none',
        }}
      />
      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '26.25rem',
            background: theme.cardBackground,
            border: `0.125rem solid ${colors.red[500]}`,
            borderRadius: '0.25rem',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            boxShadow: `0.375rem 0.375rem 0 ${colors.red[600]}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
