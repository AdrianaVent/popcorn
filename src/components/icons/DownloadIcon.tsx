import { IconProps } from './types'

export default function DownloadIcon({ size = 20, color = 'currentColor' }: IconProps) {
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
      <path d="M12 3v13M8 12l4 4 4-4M4 20h16" />
    </svg>
  )
}
