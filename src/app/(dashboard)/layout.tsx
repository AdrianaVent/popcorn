import { type ReactNode } from 'react'
import { cookies } from 'next/headers'
import DashboardGroupLayoutClient from './DashboardGroupLayoutClient'
import type { UserRole } from '@/db/users'

async function getRoleFromCookie(): Promise<UserRole | null> {
  const token = (await cookies()).get('token')?.value
  if (!token) return null
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return (payload.role as UserRole) ?? null
  } catch { return null }
}

export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const serverRole = await getRoleFromCookie()

  return (
    <DashboardGroupLayoutClient serverRole={serverRole}>
      {children}
    </DashboardGroupLayoutClient>
  )
}
