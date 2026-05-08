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

  findPaginated: (
    page: number,
    pageSize: number,
    filters: { username?: string; role?: string; created_after?: string; created_by?: string },
  ): { users: DbUser[]; total: number } => {
    const conditions: string[] = []
    const values: unknown[] = []
    if (filters.username) { conditions.push('LOWER(username) LIKE ?'); values.push(`%${filters.username.toLowerCase()}%`) }
    if (filters.role) { conditions.push('role = ?'); values.push(filters.role) }
    if (filters.created_after) { conditions.push('created_at >= ?'); values.push(new Date(filters.created_after).getTime()) }
    if (filters.created_by) { conditions.push('created_by = ?'); values.push(filters.created_by) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...values) as { count: number }
    const users = db.prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize) as DbUser[]
    return { users, total: count }
  },

  findCreators: (): Pick<DbUser, 'id' | 'username'>[] =>
    db.prepare(
      'SELECT u.id, u.username FROM users u WHERE u.id IN (SELECT DISTINCT created_by FROM users WHERE created_by IS NOT NULL) ORDER BY u.username'
    ).all() as Pick<DbUser, 'id' | 'username'>[],

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
