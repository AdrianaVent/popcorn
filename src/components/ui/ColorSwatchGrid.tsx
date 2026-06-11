'use client'

import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

type ColorOption = { value: string; labelKey: string }

type Props = {
  colors: ColorOption[]
  selected: string
  onSelect: (value: string) => void
  cols?: number
}

export default function ColorSwatchGrid({ colors, selected, onSelect, cols = 6 }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className="inline-grid gap-1.5 p-2 rounded-lg border border-border hc:border-foreground bg-card"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {colors.map((c) => {
        const isSelected = selected === c.value
        // Determine if color is light to use dark checkmark
        const r = parseInt(c.value.slice(0, 2), 16)
        const g = parseInt(c.value.slice(2, 4), 16)
        const b = parseInt(c.value.slice(4, 6), 16)
        const luminance = (r * 299 + g * 587 + b * 114) / 1000
        const checkColor = luminance > 128 ? '#000000' : '#ffffff'

        return (
          <button
            key={c.value}
            aria-label={t(c.labelKey)}
            aria-pressed={isSelected}
            title={t(c.labelKey)}
            onClick={() => onSelect(c.value)}
            className={clsx(
              'relative w-6 h-6 rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isSelected ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-110',
              c.value === 'ffffff' && 'ring-1 ring-border hc:ring-foreground'
            )}
            style={{ backgroundColor: `#${c.value}` }}
          >
            {isSelected && (
              <span
                className="absolute inset-0 flex items-center justify-center text-[10px] font-bold pointer-events-none"
                style={{ color: checkColor }}
                aria-hidden="true"
              >
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
