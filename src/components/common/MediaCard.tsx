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
}

export default function MediaCard({ posterPath, title, onClick, eager = false, overlay, children }: Props) {
  const { ref: titleRef, isTruncated } = useTruncated(title)

  return (
    <div className="flex flex-col gap-2 group">
      <button
        onClick={onClick}
        className="relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MediaPoster
          posterPath={posterPath}
          title={title}
          variant="fluid"
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
