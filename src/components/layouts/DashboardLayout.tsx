'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/common/Sidebar'
import ToastContainer from '@/components/ui/Toast/ToastContainer'
import type { UserRole } from '@/db/users'

type DashboardLayoutProps = {
  children: ReactNode
  activeNav?: string
  onLogout?: () => void
  serverRole: UserRole | null
}

export default function DashboardLayout({ children, activeNav, onLogout, serverRole }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar activeKey={activeNav} serverRole={serverRole} onLogout={onLogout} />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      <ToastContainer />
    </div>
  )
}
