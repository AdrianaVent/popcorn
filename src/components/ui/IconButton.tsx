'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

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

const tooltipHide: Record<Breakpoint, string> = {
  sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden', xl: 'xl:hidden',
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

  const tooltipPos = tooltipSide === 'top'
    ? 'bottom-full mb-1.5'
    : 'top-full mt-1.5'

  return (
    <div className="relative group inline-flex">
      <button
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
        <span className="shrink-0">{icon}</span>
        {!isGhost && (
          <span className={clsx('hidden', labelShow[showLabelAt])}>{label}</span>
        )}
      </button>

      <div className={clsx(
        'absolute right-0 z-50 pointer-events-none',
        tooltipPos,
        'opacity-0 group-hover:opacity-100 transition-opacity',
        !isGhost && tooltipHide[showLabelAt],
      )}>
        <span className="bg-foreground text-background text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-md">
          {label}
        </span>
      </div>
    </div>
  )
}
