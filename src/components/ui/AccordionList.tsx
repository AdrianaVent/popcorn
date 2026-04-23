'use client'

import { ReactNode, useState } from 'react'
import clsx from 'clsx'

type AccordionListProps<T> = {
  title: ReactNode
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  defaultOpen?: boolean
  loading?: boolean
  maxHeight?: string
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={clsx(
        'text-muted-foreground transition-transform duration-200',
        open && 'rotate-180'
      )}
    >
      <path
        d="M2.5 5L7 9.5L11.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AccordionList<T>({
  title,
  items,
  renderItem,
  defaultOpen = false,
  loading = false,
  maxHeight = '16rem',
}: AccordionListProps<T>) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50">

      {/* HEADER */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          w-full flex items-center justify-between
          px-3 py-2.5
          text-left
          transition-colors
          hover:bg-cream-200 dark:hover:bg-muted
        "
      >
        <div className="min-w-0 truncate">
          {title}
        </div>

        <Chevron open={open} />
      </button>

      {/* CONTENT */}
      {open && (
        <div
          className="border-t border-border overflow-y-auto"
          style={{ maxHeight }}
        >
          {loading && (
            <div className="p-3 flex flex-col gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded bg-border/50 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading &&
            items.map((item, index) => (
              <div key={index}>
                {renderItem(item, index)}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}