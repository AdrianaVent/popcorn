'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type Placement = 'top' | 'right' | 'bottom' | 'left'

type Props = {
  content: string
  children: React.ReactNode
  disabled?: boolean
  placement?: Placement
  className?: string
}

const OFFSET = 6

function getStyle(rect: DOMRect, placement: Placement): React.CSSProperties {
  switch (placement) {
    case 'top':
      return { left: rect.left + rect.width / 2, top: rect.top - OFFSET, transform: 'translate(-50%, -100%)' }
    case 'bottom':
      return { left: rect.left + rect.width / 2, top: rect.bottom + OFFSET, transform: 'translateX(-50%)' }
    case 'right':
      return { left: rect.right + OFFSET, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' }
    case 'left':
      return { left: rect.left - OFFSET, top: rect.top + rect.height / 2, transform: 'translate(-100%, -50%)' }
  }
}

export default function Tooltip({ content, children, disabled = false, placement = 'top', className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [style, setStyle] = useState<React.CSSProperties | null>(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const show = useCallback(() => {
    if (disabled || !content) return
    timerRef.current = setTimeout(() => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (rect) setStyle(getStyle(rect, placement))
    }, 150)
  }, [disabled, content, placement])

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    setStyle(null)
  }, [])

  return (
    <>
      <div ref={wrapperRef} onMouseEnter={show} onMouseLeave={hide} className={className}>
        {children}
      </div>
      {!disabled && style && createPortal(
        <div
          style={{ position: 'fixed', zIndex: 9999, ...style }}
          className="px-2 py-1 text-[11px] font-medium bg-gray-700 text-white rounded-md pointer-events-none whitespace-nowrap shadow-md"
        >
          {content}
        </div>,
        document.body
      )}
    </>
  )
}
