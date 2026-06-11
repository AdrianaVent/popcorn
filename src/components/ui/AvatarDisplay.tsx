'use client'

import { useState } from 'react'
import { buildAvatarUrl, DEFAULT_AVATAR, type AvatarOptions } from '@/config/avatars'

type Props = {
  opts: AvatarOptions | null
  seed: string
  size?: number
  className?: string
}

export default function AvatarDisplay({ opts, seed, size = 32, className = '' }: Props) {
  const [errored, setErrored] = useState(false)
  const options = opts ?? DEFAULT_AVATAR
  const url = buildAvatarUrl(options, seed)

  const initial = seed.charAt(0).toUpperCase()

  // eslint-disable-next-line @next/next/no-img-element -- external SVG; Next.js Image doesn't optimize SVGs
  const avatarImg = <img src={url} alt="" width={size} height={size} onError={() => setErrored(true)} className="w-full h-full object-cover" />

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/20 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {errored ? (
        <span className="text-primary font-semibold" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      ) : avatarImg}
    </span>
  )
}
