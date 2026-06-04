import { IconProps } from './types'

export default function ContrastIcon({ size = 20, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Right half filled */}
      <path d="M12 3 A9 9 0 0 1 12 21 Z" fill={color} stroke="none" />
      {/* Outer circle stroke */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none" />
      {/* Vertical divider */}
      <line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}
