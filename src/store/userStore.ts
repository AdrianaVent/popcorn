import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'
import type { UserRole } from '@/db/users'
import { type AvatarOptions, DEFAULT_AVATAR } from '@/config/avatars'

export type { UserRole }

export interface UserState {
  userId: string | null
  role: UserRole | null
  username: string | null
  avatar: AvatarOptions
  setUser: (id: string, role: UserRole, username: string, avatar: AvatarOptions) => void
  setAvatar: (avatar: AvatarOptions) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      username: null,
      avatar: DEFAULT_AVATAR,
      setUser: (id, role, username, avatar) => set({ userId: id, role, username, avatar }),
      setAvatar: (avatar) => set({ avatar }),
      clearUser: () => set({ userId: null, role: null, username: null, avatar: DEFAULT_AVATAR }),
    }),
    { name: 'popcorn-user', storage: ssrStorage }
  )
)
