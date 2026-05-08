'use client'

import { type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useUserStore } from '@/store/userStore'

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const clearUser = useUserStore((s) => s.clearUser)

  const activeNav =
    pathname.startsWith('/home') ? 'dashboard'
    : pathname.startsWith('/movies') ? 'movies'
    : pathname.startsWith('/series') ? 'series'
    : pathname.startsWith('/users') ? 'users'
    : 'dashboard'

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearUser()
    router.push('/login')
  }

  return (
    <DashboardLayout activeNav={activeNav} onLogout={handleLogout}>
      {children}
    </DashboardLayout>
  )
}
