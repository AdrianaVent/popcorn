'use client'

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { resolveGenreName } from '@/config/genres'
import { getGenreIcon } from '@/config/genreIcons'
import type { Language } from '@/store/languageStore'

type Props = {
  genreIds: number[]
  selectedGenreId: number | null
  onSelect: (id: number | null) => void
  language: Language
}

const optionCls = (active: boolean) => clsx(
  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left',
  active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/60 hc:hover:bg-muted',
)

export default function GenreDropdown({ genreIds, selectedGenreId, onSelect, language }: Props) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen]         = useState(false)
  const [style, setStyle]           = useState<React.CSSProperties>({})
  const triggerRef                  = useRef<HTMLButtonElement>(null)
  const dropdownRef                 = useRef<HTMLDivElement>(null)

  const open = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setStyle({ top: rect.bottom + 4, left: rect.left })
    setIsOpen(true)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen || !dropdownRef.current || !triggerRef.current) return
    const drop    = dropdownRef.current.getBoundingClientRect()
    const trigger = triggerRef.current.getBoundingClientRect()
    let { top, left } = style as { top: number; left: number }
    if (drop.bottom > window.innerHeight) top  = trigger.top - drop.height - 4
    if (drop.right  > window.innerWidth)  left = window.innerWidth - drop.width - 8
    if (top !== (style as { top: number }).top || left !== (style as { left: number }).left) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStyle({ top, left })
    }
  }, [isOpen, style])

  useEffect(() => {
    if (!isOpen) return
    function onOutside(e: MouseEvent) {
      if (!triggerRef.current?.contains(e.target as Node) && !dropdownRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [isOpen])

  const activeGenreName = selectedGenreId !== null
    ? resolveGenreName(selectedGenreId, language)
    : t('dashboard.top10.allGenres')

  const triggerCls = clsx(
    'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border transition-colors cursor-pointer',
    selectedGenreId !== null
      ? 'border-primary bg-primary/10 hc:bg-primary hc:text-primary-foreground text-primary'
      : 'border-border bg-muted text-foreground hover:bg-muted/60 hc:hover:bg-muted',
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        onClick={() => isOpen ? setIsOpen(false) : open()}
        className={triggerCls}
      >
        <span aria-hidden="true">
          {selectedGenreId === null
            ? <LayoutGrid size={12} className="shrink-0" />
            : (() => { const I = getGenreIcon(selectedGenreId); return I ? <I size={12} className="shrink-0" /> : <LayoutGrid size={12} className="shrink-0" /> })()
          }
        </span>
        <span className="max-w-35 truncate">{activeGenreName}</span>
        <span aria-hidden="true">
          <ChevronDown size={11} className={clsx('shrink-0 transition-transform duration-150', isOpen && 'rotate-180')} />
        </span>
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          data-cy="top10-genre-dropdown"
          className="animate-fade-in fixed z-9999 rounded-xl border border-border bg-card shadow-lg p-2 w-64"
          style={style}
        >
          <button
            type="button"
            onClick={() => { onSelect(null); setIsOpen(false) }}
            className={clsx(optionCls(selectedGenreId === null), 'w-full mb-1')}
          >
            <span aria-hidden="true"><LayoutGrid size={12} className="shrink-0" /></span>
            {t('dashboard.top10.allGenres')}
          </button>

          <div className="grid grid-cols-2 gap-0.5">
            {genreIds.map((id) => {
              const Icon = getGenreIcon(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { onSelect(id); setIsOpen(false) }}
                  className={optionCls(selectedGenreId === id)}
                >
                  {Icon && <span aria-hidden="true"><Icon size={12} className="shrink-0" /></span>}
                  <span className="truncate">{resolveGenreName(id, language)}</span>
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
