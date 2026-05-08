'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Loading from './loading'

const SeriesFeature = dynamic(() => import('@/features/series/SeriesFeature'), {
  ssr: false,
  loading: Loading,
})

export default function SeriesPage() {
  return (
    <ErrorBoundary>
      <SeriesFeature />
    </ErrorBoundary>
  )
}
