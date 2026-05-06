'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const SeriesFeature = dynamic(() => import('@/features/series/SeriesFeature'), { ssr: false })

export default function SeriesPage() {
  return (
    <ErrorBoundary>
      <SeriesFeature />
    </ErrorBoundary>
  )
}
