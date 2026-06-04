import { IconProps } from './types'

export default function SunIcon({ size = 20, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"    x2="12" y2="5" />
      <line x1="12" y1="19"   x2="12" y2="22" />
      <line x1="2"  y1="12"   x2="5"  y2="12" />
      <line x1="19" y1="12"   x2="22" y2="12" />
      <line x1="4.93"  y1="4.93"  x2="7.05"  y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93"  x2="16.95" y2="7.05" />
      <line x1="7.05"  y1="16.95" x2="4.93"  y2="19.07" />
    </svg>
  )
}
