'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Breakpoint = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  loading?: boolean
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
  /** Hide label below this breakpoint — icon stays visible */
  hideLabelBelow?: Breakpoint
  /** Hide icon below this breakpoint — label stays visible */
  hideIconBelow?: Breakpoint
}

const hidden: Record<Breakpoint, string> = {
  sm: 'hidden sm:flex', md: 'hidden md:flex', lg: 'hidden lg:flex',
}

export default function Button({
  children,
  loading = false,
  variant = 'primary',
  icon,
  hideLabelBelow,
  hideIconBelow,
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
        'inline-flex items-center justify-center gap-2',
        'w-full px-4 py-2 rounded-md text-small font-semibold',
        'transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset',
        isPrimary
          ? 'bg-primary text-primary-foreground border-0 hover:opacity-80'
          : 'bg-transparent text-foreground border border-border hover:bg-muted hc:hover:bg-muted',
        isDisabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {loading ? (
        '...'
      ) : (
        <>
          {icon && (
            <span aria-hidden="true" className={clsx('shrink-0 flex', hideIconBelow && hidden[hideIconBelow])}>
              {icon}
            </span>
          )}
          {hideLabelBelow ? (
            <span className={clsx('hidden', hideLabelBelow === 'sm' ? 'sm:inline' : hideLabelBelow === 'md' ? 'md:inline' : 'lg:inline')}>
              {children}
            </span>
          ) : (
            children
          )}
        </>
      )}
    </button>
  )
}
