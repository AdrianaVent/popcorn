'use client'

type Option<T extends string> = { value: T; label: string }

type ToggleSwitchProps<T extends string> = {
  options: [Option<T>, Option<T>]
  value: T
  onChange: (value: T) => void
  className?: string
}

export default function ToggleSwitch<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: ToggleSwitchProps<T>) {
  return (
    <div
      role="group"
      className={`inline-flex items-center rounded-full p-0.5 text-[12px] bg-primary/20 ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={
            value === opt.value
              ? 'rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground shadow-sm transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset'
              : 'rounded-full px-3 py-1 text-muted-foreground transition-all duration-150 hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset'
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
