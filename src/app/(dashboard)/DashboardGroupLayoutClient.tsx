'use client'

import { type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useUserStore } from '@/store/userStore'
import { DashboardRoleContext } from './DashboardRoleContext'
import type { UserRole } from '@/db/users'

type Props = {
  children: ReactNode
  serverRole: UserRole | null
}

export default function DashboardGroupLayoutClient({ children, serverRole }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const clearUser = useUserStore((s) => s.clearUser)

  const activeNav =
    pathname.startsWith('/home')    ? 'dashboard'
    : pathname.startsWith('/movies')  ? 'movies'
    : pathname.startsWith('/series')  ? 'series'
    : pathname.startsWith('/my-list') ? 'my-list'
    : pathname.startsWith('/users')   ? 'users'
    : 'dashboard'

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearUser()
    router.push('/login')
  }

  return (
    <DashboardRoleContext.Provider value={serverRole}>
      <DashboardLayout activeNav={activeNav} onLogout={handleLogout} serverRole={serverRole}>
        {children}
      </DashboardLayout>
    </DashboardRoleContext.Provider>
  )
}
