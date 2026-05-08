import TableSkeleton from '@/components/ui/Table/TableSkeleton'

type HeaderButton = { width: string }

type Props = {
  titleWidth?: string
  headerButtons?: HeaderButton[]
  hasImage?: boolean
  cols?: number
}

export default function PageSkeleton({
  titleWidth = 'w-20',
  headerButtons = [],
  hasImage = true,
  cols = 5,
}: Props) {
  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="shrink-0 flex items-center justify-between">
        <div className={`h-7 ${titleWidth} rounded-md bg-border animate-pulse`} />
        {headerButtons.length > 0 && (
          <div className="flex items-center gap-2">
            {headerButtons.map((btn, i) => (
              <div key={i} className={`h-8 ${btn.width} rounded-md bg-border animate-pulse`} />
            ))}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card/60 h-22 animate-pulse" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TableSkeleton hasImage={hasImage} cols={cols} />
      </div>
    </div>
  )
}
