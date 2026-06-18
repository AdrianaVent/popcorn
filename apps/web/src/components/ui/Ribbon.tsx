type RibbonSize = 'sm' | 'md'

const SIZE_CLASSES: Record<RibbonSize, string> = {
  sm: 'top-1.5 -left-5 w-14 pl-2',
  md: 'top-3 -left-6 w-24',
}

type Props = {
  label: string
  colorClass: string
  size?: RibbonSize
  'data-cy'?: string
}

export default function Ribbon({ label, colorClass, size = 'md', 'data-cy': dataCy }: Props) {
  return (
    <div
      aria-hidden="true"
      data-cy={dataCy}
      className={`absolute ${SIZE_CLASSES[size]} py-0.5 rotate-[-35deg] text-[7px] font-semibold uppercase tracking-wide text-center shadow-sm pointer-events-none ${colorClass}`}
    >
      {label}
    </div>
  )
}
