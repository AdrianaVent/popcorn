'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getTMDBImageUrl } from '@/utils/tmdb'
import Text from '@/components/ui/Text'

type Props = {
  name: string
  sub: string
  profilePath: string | null
}

export default function CastCard({ name, sub, profilePath }: Props) {
  const url = getTMDBImageUrl(profilePath, 'w185')
  const [errored, setErrored] = useState(false)

  return (
    <div className="flex flex-col items-center gap-1.5 w-16 shrink-0">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
        {url && !errored ? (
          <Image
            src={url}
            alt={name}
            width={56}
            height={56}
            className="object-cover w-full h-full"
            loading="lazy"
            onError={() => setErrored(true)}
          />
        ) : (
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </div>
      <div className="min-w-0 w-full">
        <div className="h-8 flex items-center justify-center">
          <Text variant="caption" className="font-medium text-foreground line-clamp-2 leading-tight text-center">{name}</Text>
        </div>
        <div className="my-1 h-px bg-border/40" />
        <div className="h-8 flex items-center justify-center">
          <Text variant="caption" className="italic text-muted-foreground line-clamp-2 leading-tight text-center">{sub}</Text>
        </div>
      </div>
    </div>
  )
}
