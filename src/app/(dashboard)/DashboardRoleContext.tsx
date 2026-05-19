'use client'

import { createContext, useContext } from 'react'
import type { UserRole } from '@/db/users'

export const DashboardRoleContext = createContext<UserRole | null>(null)
export const useDashboardRole = () => useContext(DashboardRoleContext)
