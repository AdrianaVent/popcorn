'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ChevronDownIcon, XIcon } from '@/components/icons'

type Option = {
  value: string | number
  label: string
}

type Props = {
  options: Option[]
  value: string | number | null
  onChange: (next: string | number | null) => void
  placeholder?: string
  searchPlaceholder?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = '—', searchPlaceholder = '...' }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => String(o.value) === String(value ?? '')) ?? null

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options

  const openDropdown = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setDropdownStyle({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }, [])

  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !triggerRef.current) return
    const drop = dropdownRef.current.getBoundingClientRect()
    const trigger = triggerRef.current.getBoundingClientRect()
    let { top, left } = dropdownStyle as { top: number; left: number }
    if (drop.bottom > window.innerHeight) top = trigger.top - drop.height - 4
    if (drop.right > window.innerWidth) left = window.innerWidth - drop.width - 8
    if (top !== (dropdownStyle as { top: number }).top || left !== (dropdownStyle as { left: number }).left) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDropdownStyle({ top, left })
    }
  }, [open, dropdownStyle])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (opt: Option) => {
    onChange(opt.value)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open ? () => setOpen(false) : openDropdown}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 text-xs border rounded-md bg-background text-foreground outline-none transition-colors cursor-pointer min-w-20',
          open ? 'border-primary/50' : 'border-border',
        )}
      >
        <span className={clsx('flex-1 text-left truncate', !selected && 'text-muted-foreground')}>
          {selected ? selected.label : placeholder}
        </span>
        {selected ? (
          <span onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
            <XIcon size={11} />
          </span>
        ) : (
          <span className={clsx('text-muted-foreground transition-transform duration-150', open && 'rotate-180')}>
            <ChevronDownIcon size={12} />
          </span>
        )}
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="animate-fade-in fixed z-9999 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          style={dropdownStyle}
        >
          <div className="p-1.5 border-b border-border">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">—</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={clsx(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer',
                    String(opt.value) === String(value ?? '')
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
