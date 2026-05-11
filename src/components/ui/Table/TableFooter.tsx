'use client'

import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import ChevronLeftIcon from '@/components/icons/ChevronLeftIcon'
import ChevronRightIcon from '@/components/icons/ChevronRightIcon'

export type TableFooterProps = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  onPageChange?: (page: number) => void
  disabled?: boolean
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (page <= 2) return [1, 2, 3]

  if (page >= totalPages - 1) {
    return [totalPages - 2, totalPages - 1, totalPages]
  }

  return [page - 1, page, page + 1]
}

export default function TableFooter({
  page,
  totalPages,
  onPrev,
  onNext,
  onPageChange,
  disabled = false,
}: TableFooterProps) {
  const { t } = useTranslation()
  const pages = getVisiblePages(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-3 py-2">

        {/* Prev */}
        <button
            onClick={onPrev}
            disabled={disabled || page <= 1}
            className="
            inline-flex items-center gap-1
            px-2 py-1 text-sm rounded-md
            text-muted-foreground
            hover:text-foreground
            transition
            disabled:opacity-40
            outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset
            "
        >
            <ChevronLeftIcon size={14} />
            <span className="hidden md:inline">{t('common.prev')}</span>
        </button>

        {/* Pages */}
        <div className="flex items-center gap-1">
            {pages.map((p) => {
            const isActive = p === page

            return (
                <button
                key={p}
                onClick={() => !disabled && onPageChange?.(p)}
                className={clsx(
                    'w-7 h-7 flex items-center justify-center rounded-md text-xs transition outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset',
                    isActive
                    ? 'bg-background border border-border text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
                >
                {p}
                </button>
            )
            })}
        </div>

        {/* Next */}
        <button
            onClick={onNext}
            disabled={disabled || page >= totalPages}
            className="
            inline-flex items-center gap-1
            px-2 py-1 text-sm rounded-md
            text-muted-foreground
            hover:text-foreground
            transition
            disabled:opacity-40
            outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset
            "
        >
            <span className="hidden md:inline">{t('common.next')}</span>
            <ChevronRightIcon size={14} />
        </button>

    </div>
  )
}