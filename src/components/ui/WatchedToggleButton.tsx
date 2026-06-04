'use client'

import clsx from 'clsx'
import { EyeIcon } from '@/components/icons'

type Props = {
  isWatched: boolean
  label: string
  onClick: () => void
  loading?: boolean
}

export default function WatchedToggleButton({ isWatched, label, onClick, loading }: Props) {
  return (
    <button
      aria-pressed={isWatched}
      onClick={onClick}
      disabled={loading}
      className={clsx(
        'shrink-0 mt-1 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors whitespace-nowrap',
        loading && 'opacity-50 cursor-wait',
        isWatched
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-foreground/10 text-foreground hover:bg-foreground/15 hc:bg-muted hc:border hc:border-border hc:hover:bg-muted-foreground/20',
      )}
    >
      <EyeIcon size={12} />
      {label}
    </button>
  )
}
