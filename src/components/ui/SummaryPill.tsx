import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function SummaryPill({ children }: Props) {
  return (
    <span className="inline-flex items-center gap-1 px-2 h-5 rounded-md bg-muted border border-border/60 text-[11px] text-foreground whitespace-nowrap">
      {children}
    </span>
  )
}
