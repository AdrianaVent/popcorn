'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import Tooltip from '@/components/ui/Tooltip'
import { ChevronDownIcon } from '@/components/icons'
import type { FilterOption } from '@/types/table'

type Props = {
  options: FilterOption[]
  value: number[]
  onChange: (next: number[]) => void
  placeholder?: string
}

export default function MultiSelectChips({ options, value, onChange, placeholder = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selected = new Set(value)
  const selectedOptions = options.filter((opt) => selected.has(Number(opt.value)))

  const openDropdown = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setDropdownStyle({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(true)
  }, [])

  // Reposition the dropdown before paint if it overflows the viewport
  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !triggerRef.current) return
    const drop = dropdownRef.current.getBoundingClientRect()
    const trigger = triggerRef.current.getBoundingClientRect()

    let { top, left } = dropdownStyle as { top: number; left: number }

    // Flip above if it clips the bottom
    if (drop.bottom > window.innerHeight) {
      top = trigger.top - drop.height - 4
    }
    // Shift left if it clips the right edge
    if (drop.right > window.innerWidth) {
      left = window.innerWidth - drop.width - 8
    }

    if (top !== (dropdownStyle as { top: number }).top || left !== (dropdownStyle as { left: number }).left) {
      setDropdownStyle({ top, left })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (id: number) => {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors cursor-pointer min-w-13',
          open ? 'border-primary/50 bg-muted' : 'border-border bg-background hover:bg-muted',
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-muted-foreground flex-1 text-left">{placeholder}</span>
        ) : (
          <span className="flex items-center gap-0.5">
            {selectedOptions.map((opt) => {
              const Icon = opt.icon ?? null
              return (
                <Tooltip key={opt.value} content={opt.label} placement="top">
                  <span className="flex items-center justify-center w-4 h-4 rounded bg-primary text-primary-foreground">
                    {Icon && <Icon size={10} strokeWidth={1.5} />}
                  </span>
                </Tooltip>
              )
            })}
          </span>
        )}
        <span
          className={clsx('flex shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')}
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <ChevronDownIcon size={11} />
        </span>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', zIndex: 9999, ...dropdownStyle }}
          className="p-2 rounded-lg border border-border bg-card shadow-lg min-w-70 max-w-95"
        >
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => {
              const id = Number(opt.value)
              const isSelected = selected.has(id)
              const Icon = opt.icon ?? null
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(id)}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] transition-colors cursor-pointer whitespace-nowrap',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted',
                  )}
                >
                  {Icon && <Icon size={11} strokeWidth={1.5} />}
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
