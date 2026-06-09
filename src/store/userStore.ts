import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'
import type { UserRole } from '@/db/users'

export type { UserRole }

export interface UserState {
  userId: string | null
  role: UserRole | null
  setUser: (id: string, role: UserRole) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      setUser: (id, role) => set({ userId: id, role }),
      clearUser: () => set({ userId: null, role: null }),
    }),
    { name: 'popcorn-user', storage: ssrStorage }
  )
)
