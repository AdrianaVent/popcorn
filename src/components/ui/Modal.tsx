'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
  dismissOnOverlayClick?: boolean
}

export default function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidth = '48rem',
  dismissOnOverlayClick = true,
}: ModalProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement

    const focusFirst = () => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    }
    // rAF lets the DOM paint before focusing so animations don't interfere
    const frame = requestAnimationFrame(focusFirst)

    return () => {
      cancelAnimationFrame(frame)
      previousFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissOnOverlayClick) {
        onClose()
        return
      }

      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, dismissOnOverlayClick])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={dismissOnOverlayClick ? onClose : undefined}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50
        backdrop-blur-sm
        p-4
        animate-fade-in
      "
    >
      <div
        ref={panelRef}
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
          animate-modal-in
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
            aria-label={t('common.close')}
            className="
              text-muted-foreground
              hover:text-red-500 dark:hover:text-red-400 hc:hover:text-destructive
              transition-colors
              text-xl leading-none
              px-2
              rounded-md
              outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset
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
