'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getTMDBImageUrl } from '@/utils/tmdb'
import { FilmIcon } from '@/components/icons'
import type { TMDBImageSize } from '@/utils/tmdb'

const variants = {
  sm:    { container: 'w-9 h-14',       imageSize: 'w92'  as TMDBImageSize, w: 36,  h: 56  },
  list:  { container: 'w-14 h-20',      imageSize: 'w92'  as TMDBImageSize, w: 56,  h: 80  },
  md:    { container: 'w-24 h-36',      imageSize: 'w185' as TMDBImageSize, w: 96,  h: 144 },
  fluid: { container: 'w-full aspect-2/3', imageSize: 'w185' as TMDBImageSize, w: 96,  h: 144 },
}

type MoviePosterProps = {
  posterPath: string | null
  title: string
  variant?: keyof typeof variants
  className?: string
  loading?: 'eager' | 'lazy'
}

export default function MoviePoster({
  posterPath,
  title,
  variant = 'sm',
  className = '',
  loading = 'lazy',
}: MoviePosterProps) {
  const { container, imageSize, w, h } = variants[variant]
  const url = getTMDBImageUrl(posterPath, imageSize)
  const [erroredUrl, setErroredUrl] = useState<string | null>(null)
  const imgError = url !== null && url === erroredUrl

  if (!url || imgError) {
    return (
      <div className={`${container} rounded bg-muted border border-border shrink-0 flex items-center justify-center ${className}`}>
        <FilmIcon size={16} color="var(--color-muted-foreground)" />
      </div>
    )
  }

  return (
    <div className={`${container} rounded overflow-hidden shrink-0 ${className}`}>
      <Image
        src={url}
        alt={title}
        width={w}
        height={h}
        className="object-cover w-full h-full"
        loading={loading}
        onError={() => setErroredUrl(url)}
      />
    </div>
  )
}
