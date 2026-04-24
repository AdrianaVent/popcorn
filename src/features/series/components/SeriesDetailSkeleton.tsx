export default function SeriesDetailSkeleton() {
  return (
    <div className="flex gap-6 animate-pulse">
      <div className="w-24 h-36 rounded bg-border/50 shrink-0" />
      <div className="flex-1 flex flex-col gap-3 pt-1">
        <div className="h-6 bg-border/50 rounded w-3/4" />
        <div className="h-4 bg-border/50 rounded w-1/2" />
        <div className="h-4 bg-border/50 rounded w-1/3" />
      </div>
    </div>
  )
}
