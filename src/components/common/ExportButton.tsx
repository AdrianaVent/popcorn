'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DownloadIcon } from '@/components/icons'

type ExportFormat = 'json' | 'csv'

type Props = {
  onExport?: (format: ExportFormat) => void
  disabled?: boolean
}

export default function ExportButton({ onExport = () => {}, disabled = false }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative group/export" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DownloadIcon size={15} />
        <span className="hidden md:inline">{t('export.button')}</span>
      </button>

      {/* Tooltip shown on small screens only when dropdown is closed */}
      {!open && (
        <span className="md:hidden pointer-events-none absolute right-0 top-full mt-1.5 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover/export:opacity-100 transition-opacity z-30">
          {t('export.button')}
        </span>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20 w-full">
          {(['json', 'csv'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => { onExport(fmt); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted-foreground/15 transition-colors"
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
