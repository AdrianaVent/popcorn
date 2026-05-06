'use client'

import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const UsersFeature = dynamic(() => import('@/features/users/UsersFeature'), { ssr: false })

export default function UsersPage() {
  return (
    <ErrorBoundary>
      <UsersFeature />
    </ErrorBoundary>
  )
}
