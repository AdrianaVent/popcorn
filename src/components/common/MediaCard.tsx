'use client'

import type { ReactNode } from 'react'
import MediaPoster from '@/components/common/MediaPoster'
import Tooltip from '@/components/ui/Tooltip'
import { useTruncated } from '@/hooks/useTruncated'

type Props = {
  posterPath: string | null
  title: string
  onClick: () => void
  eager?: boolean
  overlay?: ReactNode
  children?: ReactNode
  isSelected?: boolean
  variant?: 'fluid' | 'md' | 'sm' | 'list'
}

const FIXED_WIDTH: Partial<Record<'fluid' | 'md' | 'sm' | 'list', string>> = {
  sm: 'w-9',
  list: 'w-14',
  md: 'w-24',
}

export default function MediaCard({ posterPath, title, onClick, eager = false, overlay, children, isSelected = false, variant = 'fluid' }: Props) {
  const { ref: titleRef, isTruncated } = useTruncated(title)
  const widthClass = FIXED_WIDTH[variant] ?? ''

  return (
    <div className={`flex flex-col gap-2 group ${widthClass}`}>
      <button
        onClick={onClick}
        aria-label={title}
        className={`relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${variant === 'fluid' ? 'w-full' : 'w-fit'} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      >
        <MediaPoster
          posterPath={posterPath}
          title={title}
          variant={variant}
          loading={eager ? 'eager' : 'lazy'}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
        {overlay}
      </button>

      <div className="flex flex-col gap-1 px-0.5 items-center w-full">
        <Tooltip content={title} disabled={!isTruncated} placement="bottom" className="w-full">
          <p ref={titleRef} className="text-[13px] font-medium text-foreground leading-tight truncate w-full text-center">
            {title}
          </p>
        </Tooltip>
        {children}
      </div>
    </div>
  )
}
