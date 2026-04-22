'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DashboardFeature from './DashboardFeature'

export default function Dashboard() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <DashboardLayout activeNav="dashboard" onLogout={handleLogout}>
      <DashboardFeature />
    </DashboardLayout>
  )
}
