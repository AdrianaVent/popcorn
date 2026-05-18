'use client'

import { useState, useId } from 'react'
import type { Rating } from '@/store/ratingsStore'

type Props = {
  value: Rating | null
  onChange?: (rating: Rating) => void
  readonly?: boolean
  size?: number
}

const STARS = [1, 2, 3, 4, 5] as const

export default function StarRating({ value, onChange, readonly = false, size = 18 }: Props) {
  const uid = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState<Rating | null>(null)

  const display = hovered ?? value

  const handleMouseMove = (star: number, e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const half = (e.clientX - rect.left) < rect.width / 2
    setHovered(((half ? star - 0.5 : star) as Rating))
  }

  const handleClick = (star: number, e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const half = (e.clientX - rect.left) < rect.width / 2
    onChange((half ? star - 0.5 : star) as Rating)
  }

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHovered(null)}
      role={readonly ? undefined : 'slider'}
      aria-valuenow={value ?? 0}
      aria-valuemin={0}
      aria-valuemax={5}
    >
      {STARS.map((star) => {
        const filled = display !== null && display >= star
        const half   = display !== null && !filled && display >= star - 0.5

        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            onMouseMove={readonly ? undefined : (e) => handleMouseMove(star, e)}
            onClick={readonly ? undefined : (e) => handleClick(star, e)}
            className={
              (readonly ? 'shrink-0' : 'shrink-0 cursor-pointer') + ' ' +
              (filled || half
                ? 'text-yellow-500 dark:text-yellow-300'
                : hovered !== null && !readonly
                  ? 'text-yellow-500/40 dark:text-yellow-300/30'
                  : 'text-muted-foreground/30')
            }
          >
            <defs>
              <linearGradient id={`half-${uid}-${star}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43.94-5.49-4-3.9 5.53-.8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill={
                filled ? 'currentColor'
                : half   ? `url(#half-${uid}-${star})`
                :          'none'
              }
            />
          </svg>
        )
      })}
    </div>
  )
}
