'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Loading from './loading'

const UsersFeature = dynamic(() => import('@/features/users/UsersFeature'), {
  ssr: false,
  loading: Loading,
})

export default function UsersPage() {
  return (
    <ErrorBoundary>
      <UsersFeature />
    </ErrorBoundary>
  )
}
