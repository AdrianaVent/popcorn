'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import Tooltip from './Tooltip'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  label: string
  variant?: 'default' | 'ghost'
  /** Only for variant="default" — breakpoint at which the label becomes visible. */
  showLabelAt?: Breakpoint
  /** Side the tooltip appears on. */
  tooltipSide?: 'top' | 'bottom'
}

const labelShow: Record<Breakpoint, string> = {
  sm: 'sm:inline', md: 'md:inline', lg: 'lg:inline', xl: 'xl:inline',
}

export default function IconButton({
  icon,
  label,
  variant = 'default',
  showLabelAt = 'md',
  tooltipSide = 'bottom',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  const isGhost = variant === 'ghost'

  return (
    <Tooltip content={label} placement={tooltipSide} disabled={!isGhost}>
      <button
        aria-label={label}
        disabled={disabled}
        className={clsx(
          'flex items-center gap-1.5 rounded-md transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset',
          isGhost
            ? 'p-1.5 text-muted-foreground'
            : 'px-3 py-1.5 border border-border bg-card text-foreground hover:bg-muted/60 text-sm font-medium',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        <span className="shrink-0" aria-hidden="true">{icon}</span>
        {!isGhost && (
          <span className={clsx('hidden', labelShow[showLabelAt])} aria-hidden="true">{label}</span>
        )}
      </button>
    </Tooltip>
  )
}
