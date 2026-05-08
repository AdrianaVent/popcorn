'use client'

import { InputHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  rightElement?: ReactNode
}

export default function Input({ label, error, id, rightElement, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-caption font-normal text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={clsx(
            'w-full px-3 py-2.5 rounded-md border text-small text-foreground bg-card outline-none transition-colors [&:-webkit-autofill]:shadow-[0_0_0px_1000px_var(--card)_inset] [&:-webkit-autofill]:[webkit-text-fill-color:var(--foreground)]',
            rightElement && 'pr-10',
            error ? 'border-destructive' : 'border-border',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span className="flex items-center gap-1 text-[0.7rem] leading-4 text-destructive">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
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
