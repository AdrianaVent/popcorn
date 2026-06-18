'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean
  children: ReactNode
}

export default function IconToggleButton({ active, children, className, ...props }: Props) {
  return (
    <button
      aria-pressed={active}
      className={clsx(
        'w-7 h-7 flex items-center justify-center rounded border transition-colors cursor-pointer',
        active
          ? 'border-primary text-primary bg-primary/10 hc:bg-primary hc:text-primary-foreground hc:border-primary'
          : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 hc:hover:border-primary hc:hover:text-primary hc:hover:bg-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
