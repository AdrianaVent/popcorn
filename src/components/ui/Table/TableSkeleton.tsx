const WIDTHS = ['w-1/4', 'w-1/3', 'w-1/5', 'w-1/2', 'w-2/5', 'w-1/4', 'w-1/3', 'w-1/5']

type Props = {
  rows?: number
  hasImage?: boolean
  cols?: number
}

export default function TableSkeleton({ rows = 9, hasImage = true, cols = 5 }: Props) {
  return (
    <div className="relative flex flex-col h-full border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-3 py-3 border-b border-border bg-muted/40">
        {hasImage && <div className="w-10 h-3 rounded bg-border animate-pulse shrink-0" />}
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={`h-3 rounded bg-border animate-pulse ${WIDTHS[i % WIDTHS.length]}`} />
        ))}
      </div>
      {/* Rows */}
      <div className="flex-1 min-h-0 overflow-hidden divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-3">
            {hasImage && <div className="w-10 h-10 rounded-md bg-border animate-pulse shrink-0" />}
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className={`h-3 rounded bg-border animate-pulse ${WIDTHS[(i + j) % WIDTHS.length]}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
