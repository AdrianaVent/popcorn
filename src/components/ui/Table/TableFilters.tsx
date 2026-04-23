'use client'

type Props<T> = {
  filters: Partial<T>
  onChange: (next: Partial<T>) => void
  children: React.ReactNode
}

export default function TableFilters<T>({
  children,
}: Props<T>) {
  return (
    <div className="flex flex-col gap-3">
      {children}
    </div>
  )
}