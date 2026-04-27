import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

// Singleton: Node.js caches modules, so this instance is shared across all Route Handlers
// in the same process. better-sqlite3 is synchronous and not safe for concurrent writes,
// but Next.js Route Handlers are single-threaded per request, so this is fine.
const db = new Database(path.join(DATA_DIR, 'popcorn.db'))

// Schema migration runs once at module load. CREATE TABLE IF NOT EXISTS is idempotent,
// so importing this module from both Route Handlers and the seed script is safe.
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
