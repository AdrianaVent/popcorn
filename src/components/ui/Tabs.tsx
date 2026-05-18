'use client'

import clsx from 'clsx'

type Tab<T extends string> = { value: T; label: string }

type Variant = 'card' | 'plain'

type Props<T extends string> = {
  tabs: Tab<T>[]
  activeTab: T
  onTabChange: (value: T) => void
  start?: React.ReactNode
  fillBorder?: boolean
  variant?: Variant
  className?: string
}

export default function Tabs<T extends string>({ tabs, activeTab, onTabChange, start, fillBorder = true, variant = 'card', className }: Props<T>) {
  return (
    <div className={clsx('relative flex w-full items-end', className)}>
      {fillBorder && <div className="absolute inset-x-0 bottom-0 border-b border-border" />}
      <div className="flex-1 flex items-end justify-between gap-2 pb-1.5">
        {start}
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={clsx(
            'px-5 py-2 text-sm font-medium border transition-colors -mb-px relative z-10 rounded-t-lg',
            activeTab === tab.value
              ? variant === 'card'
                ? 'bg-card border-border text-foreground'
                : 'bg-background border-border text-primary'
              : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground',
          )}
          style={activeTab === tab.value
            ? { borderBottomColor: variant === 'card' ? 'var(--color-card)' : 'var(--color-background)' }
            : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
