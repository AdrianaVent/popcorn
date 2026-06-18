import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { usersDb } from '../src/db/users'

const username = process.argv[2] ?? 'admin'
const password = process.argv[3] ?? 'Admin123!'

const hash = bcrypt.hashSync(password, 10)

try {
  usersDb.create({ id: randomUUID(), username, password: hash, role: 'admin', created_by: null })
  console.log(`✓ Admin user "${username}" created. Password: ${password}`)
} catch (e: unknown) {
  if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) {
    console.log(`User "${username}" already exists.`)
  } else {
    throw e
  }
}
