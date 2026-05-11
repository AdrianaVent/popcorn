'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Loading from './loading'

const Home = dynamic(() => import('@/features/home'), {
  ssr: false,
  loading: Loading,
})

export default function HomePage() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  )
}
