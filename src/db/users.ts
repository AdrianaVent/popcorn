import db from './client'

export type UserRole = 'admin' | 'guest'

export interface DbUser {
  id: string
  username: string
  password: string
  role: UserRole
  created_at: number
  created_by: string | null
}

export const usersDb = {
  findByUsername: (username: string): DbUser | undefined =>
    db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined,

  findById: (id: string): DbUser | undefined =>
    db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined,

  create: (user: Omit<DbUser, 'created_at'>): DbUser => {
    const now = Date.now()
    db.prepare(
      'INSERT INTO users (id, username, password, role, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.id, user.username, user.password, user.role, now, user.created_by ?? null)
    return { ...user, created_at: now }
  },
}
