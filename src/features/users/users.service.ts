import type { PublicUser } from '@/types/user'
import type { UserRole } from '@/db/users'
import { apiFetch } from '@/services/apiFetch'

export type CreateUserInput = { username: string; password: string; role: UserRole }
export type UpdateUserInput = { username?: string; password?: string; role?: UserRole }

async function request(url: string, options?: RequestInit): Promise<Response> {
  const res = await apiFetch(url, options)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.code ?? 'UNKNOWN_ERROR')
  }
  return res
}

export async function fetchUsers(): Promise<PublicUser[]> {
  const res = await request('/api/users')
  return res.json()
}

export async function createUser(data: CreateUserInput): Promise<void> {
  await request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<void> {
  await request(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: string): Promise<void> {
  await request(`/api/users/${id}`, { method: 'DELETE' })
}

export async function deleteUsers(ids: string[]): Promise<void> {
  await request('/api/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
}

export type ImportUserRow = { username: string; password: string; role: string }
export type ImportFailedRow = { index: number; username: string; code: string; fields?: string[] }
export type ImportResult = { created: number; failed: ImportFailedRow[] }

export async function importUsers(users: ImportUserRow[]): Promise<ImportResult> {
  const res = await request('/api/users/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users }),
  })
  return res.json()
}
