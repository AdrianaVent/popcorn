'use client'

import { ReactNode, useEffect } from 'react'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ title, onClose, children, maxWidth = '22rem' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-6 w-full bg-card border border-border rounded-2xl p-7 shadow-2xl"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-small font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-muted-foreground text-xl leading-none p-1 bg-transparent border-0 cursor-pointer"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
