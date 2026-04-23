'use client'

import { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-repeat"
        style={{
          backgroundImage: 'url(\'/icons/favicon-32x32.png\')',
          backgroundSize: '3.25rem 3.25rem',
          opacity: 'var(--pattern-opacity)',
        }}
      />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-105 bg-card border-2 border-red-500 rounded shadow-[0.375rem_0.375rem_0_var(--color-red-600)] flex flex-col gap-7 p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
