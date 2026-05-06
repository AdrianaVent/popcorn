'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const MoviesFeature = dynamic(() => import('@/features/movies/MoviesFeature'), { ssr: false })

export default function MoviesPage() {
  return (
    <ErrorBoundary>
      <MoviesFeature />
    </ErrorBoundary>
  )
}
