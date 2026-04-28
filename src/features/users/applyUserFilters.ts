import type { PublicUser } from '@/types/user'
import type { UserFilters } from './userFilters.schema'

export function applyUserFilters(users: PublicUser[], filters: Partial<UserFilters>): PublicUser[] {
  return users.filter((u) => {
    if (filters.username && !u.username.toLowerCase().includes(filters.username.toLowerCase())) return false
    if (filters.role && u.role !== filters.role) return false
    if (filters.created_after) {
      const from = new Date(filters.created_after).getTime()
      if (u.created_at < from) return false
    }
    if (filters.created_by && u.created_by !== filters.created_by) return false
    return true
  })
}
