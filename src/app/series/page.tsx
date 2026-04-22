'use client'

import dynamic from 'next/dynamic'

const SeriesFeature = dynamic(() => import('@/features/series/SeriesFeature'), { ssr: false })

export default function SeriesPage() {
  return <SeriesFeature />
}
