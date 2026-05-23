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
  actions?: ReactNode
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={clsx(
        'text-muted-foreground transition-transform duration-200 shrink-0',
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
  actions,
}: AccordionListProps<T>) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-lg overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-muted/40 border-b border-border px-3 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset rounded-sm"
        >
          <Chevron open={open} />
          <div className="min-w-0 truncate">
            {title}
          </div>
        </button>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {actions}
          </div>
        )}
      </div>

      {/* CONTENT — grid-template-rows trick for smooth height transition */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="overflow-hidden">
          <div
            className="overflow-y-auto bg-card/50"
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
        </div>
      </div>
    </div>
  )
}
