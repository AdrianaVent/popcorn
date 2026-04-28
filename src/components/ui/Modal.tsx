'use client'

import { ReactNode, useEffect } from 'react'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export default function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidth = '48rem',
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50
        backdrop-blur-sm
        p-4
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
        className="
          w-full
          max-h-[90vh]
          overflow-hidden
          flex flex-col
          bg-card
          border border-border
          rounded-2xl
          shadow-2xl
          animate-in fade-in zoom-in-95
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            className="
              text-[13px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-foreground
              truncate
            "
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="
              text-muted-foreground
              hover:text-red-500
              transition-colors
              text-xl leading-none
              px-2
              rounded-md
            "
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* FOOTER — rendered outside the scroll area so it stays fixed */}
        {footer}
      </div>
    </div>
  )
}