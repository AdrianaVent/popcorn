'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Loading from './loading'

const MoviesFeature = dynamic(() => import('@/features/movies/MoviesFeature'), {
  ssr: false,
  loading: Loading,
})

export default function MoviesPage() {
  return (
    <ErrorBoundary>
      <MoviesFeature />
    </ErrorBoundary>
  )
}
