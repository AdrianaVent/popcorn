import { IconProps } from './types'

export default function UploadIcon({ size = 20, color = 'currentColor' }: IconProps) {
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
    >
      <path d="M4 20h16M12 17v-13M8 8l4-4 4 4" />
    </svg>
  )
}
