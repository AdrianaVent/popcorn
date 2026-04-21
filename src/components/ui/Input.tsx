'use client'

import { InputHTMLAttributes, ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { textStyles } from '@/styles/typography'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  rightElement?: ReactNode
}

export default function Input({ label, error, id, rightElement, ...props }: InputProps) {
  const { theme } = useThemeStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: textStyles.caption.size,
            fontWeight: textStyles.caption.weight,
            lineHeight: textStyles.caption.lineHeight,
            color: theme.textSecondary,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          style={{
            padding: rightElement ? '0.625rem 2.5rem 0.625rem 0.75rem' : '0.625rem 0.75rem',
            borderRadius: '0.375rem',
            border: `0.0625rem solid ${error ? theme.error : theme.border}`,
            fontSize: textStyles.small.size,
            lineHeight: textStyles.small.lineHeight,
            color: theme.text,
            background: theme.cardBackground,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
          {...props}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.7rem',
            lineHeight: '1rem',
            color: theme.error,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
            <path d="M6 3.5V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.6" fill="currentColor" />
          </svg>
          {error}
        </span>
      )}
    </div>
  )
}
