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

  findAll: (): DbUser[] =>
    db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as DbUser[],

  create: (user: Omit<DbUser, 'created_at'> & { created_at?: number }): DbUser => {
    const now = user.created_at ?? Date.now()
    db.prepare(
      'INSERT INTO users (id, username, password, role, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.id, user.username, user.password, user.role, now, user.created_by ?? null)
    return { ...user, created_at: now }
  },

  update: (id: string, fields: Partial<Pick<DbUser, 'username' | 'password' | 'role'>>): void => {
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
    if (!entries.length) return
    const setClauses = entries.map(([k]) => `${k} = ?`).join(', ')
    const values = entries.map(([, v]) => v)
    db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`).run(...values, id)
  },

  deleteById: (id: string): void => {
    db.prepare('DELETE FROM users WHERE id = ?').run(id)
  },

  deleteMany: (ids: string[]): void => {
    const placeholders = ids.map(() => '?').join(', ')
    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids)
  },
}
