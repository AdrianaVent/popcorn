const BAR_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2', 'w-3/4', 'w-2/5', 'w-1/3', 'w-1/2', 'w-3/5', 'w-1/4']

export default function Loading() {
  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="shrink-0 flex items-center justify-between">
        <div className="h-7 w-16 rounded-md bg-border animate-pulse" />
      </div>
      <div className="w-full xl:w-1/2 flex flex-col border border-border rounded-lg rounded-tr-none bg-card p-4 gap-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-border animate-pulse" />
          <div className="h-7 w-28 rounded bg-border animate-pulse" />
        </div>
        <div className="flex flex-col gap-3 mt-2">
          {BAR_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-24 rounded bg-border animate-pulse shrink-0" />
              <div className={`h-5 rounded bg-border animate-pulse ${w}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
