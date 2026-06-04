import { IconProps } from './types'

export default function ChevronLeftIcon({ size = 20, color = 'currentColor', 'aria-hidden': ariaHidden }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
