import { IconProps } from './types'

export default function ChevronRightIcon({ size = 20, color = 'currentColor', 'aria-hidden': ariaHidden }: IconProps) {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
