'use client'

import Text from '@/components/ui/Text'

type MetaRowProps = {
  label: string
  value: React.ReactNode
  align?: 'left' | 'right'
}

export default function MetaRow({
  label,
  value,
  align = 'right',
}: MetaRowProps) {
  return (
    <div className="flex gap-3 items-start">
      <Text variant="small" className="text-muted-foreground shrink-0 w-24">
        {label}
      </Text>

      <div className={`flex-1 flex ${align === 'right' ? 'justify-end' : ''}`}>
        {typeof value === 'string' ? (
          <Text variant="small" className="text-foreground">
            {value}
          </Text>
        ) : (
          value
        )}
      </div>
    </div>
  )
}