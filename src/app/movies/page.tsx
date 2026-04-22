'use client'

import dynamic from 'next/dynamic'

const MoviesFeature = dynamic(() => import('@/features/movies/MoviesFeature'), { ssr: false })

export default function MoviesPage() {
  return <MoviesFeature />
}
