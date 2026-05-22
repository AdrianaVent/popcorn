'use strict'

const Database = require('better-sqlite3')
const bcrypt   = require('bcryptjs')
const crypto   = require('crypto')
const path     = require('path')

const username = process.env.ADMIN_USERNAME || 'admin'
const password = process.env.ADMIN_PASSWORD || 'Admin123!'

const db = new Database(path.join(process.cwd(), 'data', 'popcorn.db'))

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

const hash = bcrypt.hashSync(password, 10)

try {
  db.prepare(
    'INSERT INTO users (id, username, password, role, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), username, hash, 'admin', Date.now(), null)
  console.log(`Admin user "${username}" created.`)
} catch (e) {
  if (e.message.includes('UNIQUE constraint failed')) {
    console.log(`User "${username}" already exists — skipping.`)
  } else {
    throw e
  }
}
