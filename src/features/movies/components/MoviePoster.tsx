import Image from 'next/image'
import { getTMDBImageUrl } from '@/utils/tmdb'
import type { TMDBImageSize } from '@/utils/tmdb'

const variants = {
  sm: { container: 'w-9 h-14',   imageSize: 'w92'  as TMDBImageSize, sizes: '36px' },
  md: { container: 'w-24 h-36',  imageSize: 'w185' as TMDBImageSize, sizes: '96px' },
}

type MoviePosterProps = {
  posterPath: string | null
  title: string
  variant?: keyof typeof variants
  className?: string
}

export default function MoviePoster({
  posterPath,
  title,
  variant = 'sm',
  className = '',
}: MoviePosterProps) {
  const { container, imageSize, sizes } = variants[variant]
  const url = getTMDBImageUrl(posterPath, imageSize)

  if (!url) {
    return <div className={`${container} rounded bg-border shrink-0 ${className}`} />
  }

  return (
    <div className={`relative ${container} rounded overflow-hidden shrink-0 ${className}`}>
      <Image src={url} alt={title} fill sizes={sizes} className="object-cover" />
    </div>
  )
}
