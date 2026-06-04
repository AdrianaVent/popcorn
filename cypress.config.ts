import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    allowCypressEnv: false,
    setupNodeEvents(on) {
      on('task', {
        seedUser({ username, password, role }: { username: string; password: string; role: 'admin' | 'guest' }) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const Database = require('better-sqlite3')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const bcrypt = require('bcryptjs')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { randomUUID } = require('crypto')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const path = require('path')
          const db = new Database(path.join(process.cwd(), 'data', 'popcorn.db'))
          db.exec(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'guest')),
            created_at INTEGER NOT NULL,
            created_by TEXT
          )`)
          const hash = bcrypt.hashSync(password, 10)
          try {
            db.prepare(
              'INSERT INTO users (id, username, password, role, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(randomUUID(), username, hash, role, Date.now(), null)
          } catch (e: unknown) {
            if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) return null
            throw e
          }
          return null
        },

        deleteUser(username: string) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const Database = require('better-sqlite3')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const path = require('path')
          const db = new Database(path.join(process.cwd(), 'data', 'popcorn.db'))
          db.prepare('DELETE FROM users WHERE username = ?').run(username)
          return null
        },
      })
    },
  },
})
