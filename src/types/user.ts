import type { UserRole } from '@/db/users'

export type PublicUser = {
  id: string
  username: string
  role: UserRole
  created_at: number
  created_by: string | null
}
