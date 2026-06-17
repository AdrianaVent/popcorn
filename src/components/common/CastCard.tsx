'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { getTMDBImageUrl } from '@/utils/tmdb'
import Text from '@/components/ui/Text'
import { translateCharacter } from '@/utils/translateCharacter'

type Props = {
  name: string
  sub: string
  profilePath: string | null
  onClick?: () => void
}

export default function CastCard({ name, sub, profilePath, onClick }: Props) {
  const { t } = useTranslation()
  const url = getTMDBImageUrl(profilePath, 'w185')
  const [errored, setErrored] = useState(false)
  const translatedSub = translateCharacter(sub, t)

  const Wrapper = onClick ? 'button' : 'div'
  const wrapperProps = onClick
    ? { type: 'button' as const, onClick, 'aria-label': name, className: 'group flex flex-col items-center gap-1.5 w-16 shrink-0 rounded-md cursor-pointer text-left border-0 outline-none focus-visible:ring-1 focus-visible:ring-primary' }
    : { className: 'flex flex-col items-center gap-1.5 w-16 shrink-0' }

  return (
    <Wrapper {...wrapperProps}>
      <div className={`w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 transition-colors ${onClick ? 'border-2 border-border group-hover:border-primary hc:group-hover:border-primary hc:group-hover:ring-2 hc:group-hover:ring-primary hc:group-hover:ring-offset-2' : 'border border-border'}`}>
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
          <Text variant="caption" className={`line-clamp-2 leading-tight text-center transition-colors ${onClick ? 'font-medium text-foreground group-hover:text-primary group-hover:font-bold hc:group-hover:text-foreground' : 'font-medium text-foreground'}`}>{name}</Text>
        </div>
        <div className="my-1 h-px bg-border/40" />
        <div className="h-8 flex items-center justify-center">
          <Text variant="caption" className={`italic line-clamp-2 leading-tight text-center transition-colors ${onClick ? 'text-muted-foreground group-hover:text-primary group-hover:font-bold hc:group-hover:text-foreground' : 'text-muted-foreground'}`}>{translatedSub}</Text>
        </div>
      </div>
    </Wrapper>
  )
}
