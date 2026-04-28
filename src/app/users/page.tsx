'use client'

import dynamic from 'next/dynamic'

const UsersFeature = dynamic(() => import('@/features/users/UsersFeature'), { ssr: false })

export default function UsersPage() {
  return <UsersFeature />
}
