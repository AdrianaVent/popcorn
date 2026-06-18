const WIDTHS = ['w-1/4', 'w-1/3', 'w-1/5', 'w-1/2', 'w-2/5', 'w-1/4', 'w-1/3', 'w-1/5']

type Props = {
  rows?: number
  hasImage?: boolean
  cols?: number
  showFooter?: boolean
}

export default function TableSkeleton({ rows = 9, hasImage = true, cols = 5, showFooter = true }: Props) {
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
      {/* Footer */}
      {showFooter && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-3 py-2">
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-5 w-16 rounded bg-border animate-pulse" />
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-7 w-7 rounded-md bg-border animate-pulse" />
              ))}
            </div>
            <div className="h-5 w-16 rounded bg-border animate-pulse" />
          </div>
        </div>
      )}
    </div>
  )
}
