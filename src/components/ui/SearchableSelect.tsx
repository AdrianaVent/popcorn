'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react'
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
  ariaLabel?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = '—', searchPlaceholder = '...', ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selected = options.find((o) => String(o.value) === String(value ?? '')) ?? null

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options

  const openDropdown = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) setDropdownStyle({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
    setActiveIndex(-1)
  }, [])

  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !containerRef.current) return
    const drop = dropdownRef.current.getBoundingClientRect()
    const container = containerRef.current.getBoundingClientRect()
    let { top, left } = dropdownStyle as { top: number; left: number }
    if (drop.bottom > window.innerHeight) top = container.top - drop.height - 4
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
      setActiveIndex(-1)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(e.target as Node) &&
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

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter' && activeIndex >= 0 && filtered[activeIndex]) {
      e.preventDefault()
      handleSelect(filtered[activeIndex])
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 text-xs border rounded-md bg-background text-foreground min-w-20 transition-colors',
          open ? 'border-primary/50' : 'border-border',
        )}
      >
        <button
          ref={triggerRef}
          onClick={open ? () => setOpen(false) : openDropdown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={ariaLabel}
          className="flex-1 text-left truncate outline-none cursor-pointer"
        >
          <span className={clsx(!selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
        </button>

        {selected ? (
          <button
            onClick={handleClear}
            aria-label="Clear selection"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 outline-none cursor-pointer"
          >
            <XIcon size={11} />
          </button>
        ) : (
          <span aria-hidden="true" className={clsx('text-muted-foreground transition-transform duration-150 shrink-0', open && 'rotate-180')}>
            <ChevronDownIcon size={12} />
          </span>
        )}
      </div>

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
              onChange={(e) => { setSearch(e.target.value); setActiveIndex(-1) }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label="Search options"
              aria-controls={listId}
              aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
              className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div
            id={listId}
            role="listbox"
            className="overflow-y-auto max-h-48"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">—</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  id={`${listId}-opt-${idx}`}
                  role="option"
                  aria-selected={String(opt.value) === String(value ?? '')}
                  onClick={() => handleSelect(opt)}
                  className={clsx(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer',
                    idx === activeIndex
                      ? 'bg-primary/20 text-primary'
                      : String(opt.value) === String(value ?? '')
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
