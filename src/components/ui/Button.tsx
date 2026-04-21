'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { textStyles } from '@/styles/typography'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

export default function Button({
  children,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useThemeStore()

  const isPrimary = variant === 'primary'
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      style={{
        padding: '0.625rem 1rem',
        borderRadius: '0.375rem',
        border: isPrimary ? 'none' : `0.0625rem solid ${theme.border}`,
        background: isPrimary ? theme.principal : 'transparent',
        color: isPrimary ? theme.principalText : theme.text,
        fontSize: textStyles.small.size,
        fontWeight: 600,
        lineHeight: textStyles.small.lineHeight,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        width: '100%',
        transition: 'opacity 0.2s',
        ...style,
      }}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}
