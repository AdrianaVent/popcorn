'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Loading from './loading'

const Dashboard = dynamic(() => import('@/features/dashboard'), {
  ssr: false,
  loading: Loading,
})

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  )
}
