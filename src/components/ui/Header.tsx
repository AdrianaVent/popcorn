'use client'

import { ReactNode } from 'react'

type Props = {
  title: string
  start?: ReactNode
  end?: ReactNode
  className?: string
}

export default function Header({
  title,
  start = undefined,
  end = undefined,
  className = '',
}: Props) {
  return (
    <div className={`shrink-0 flex items-center justify-between ${className}`}>
      
      <div className="flex items-center gap-3">
        {start}

        <h1 className="text-title font-semibold text-foreground tracking-wide">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {end}
      </div>

    </div>
  )
}