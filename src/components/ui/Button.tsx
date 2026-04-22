'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

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
  className,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary'
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'w-full px-4 py-2.5 rounded-md text-small font-semibold transition-opacity duration-200 cursor-pointer',
        isPrimary
          ? 'bg-primary text-primary-foreground border-0'
          : 'bg-transparent text-foreground border border-border',
        isDisabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}
