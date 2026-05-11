'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/common/Sidebar'
import Topbar from '@/components/common/Topbar'
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
      <Sidebar activeKey={activeNav} serverRole={serverRole} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <ToastContainer />
    </div>
  )
}
