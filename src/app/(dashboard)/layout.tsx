import { type ReactNode } from 'react'
import { cookies } from 'next/headers'
import DashboardGroupLayoutClient from './DashboardGroupLayoutClient'
import type { UserRole } from '@/db/users'

async function getPayloadFromCookie(): Promise<{ role: UserRole | null; username: string | null }> {
  const token = (await cookies()).get('token')?.value
  if (!token) return { role: null, username: null }
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return { role: (payload.role as UserRole) ?? null, username: (payload.username as string) ?? null }
  } catch { return { role: null, username: null } }
}

export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const { role: serverRole, username: serverUsername } = await getPayloadFromCookie()

  return (
    <DashboardGroupLayoutClient serverRole={serverRole} serverUsername={serverUsername}>
      {children}
    </DashboardGroupLayoutClient>
  )
}
