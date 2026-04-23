'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function DashboardFeature() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <DashboardLayout activeNav="dashboard" onLogout={handleLogout}>
      <div className="p-8" />
    </DashboardLayout>
  )
}
