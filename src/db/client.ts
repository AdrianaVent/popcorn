import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

const db = new Database(path.join(DATA_DIR, 'popcorn.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL CHECK(role IN ('admin', 'guest')),
    created_at INTEGER NOT NULL,
    created_by TEXT
  )
`)

export default db
