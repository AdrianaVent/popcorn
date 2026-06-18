import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { usersDb } from '@/db/users'
import { requireAdmin } from '@/services/auth/requireAdmin'
import type { UserRole } from '@/db/users'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const VALID_ROLES: UserRole[] = ['admin', 'guest']

type ImportRow = { username: string; password: string; role: string; created_by?: string | null; created_at?: string | null }
type FailedRow = { index: number; username: string; code: string; fields?: string[] }

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (typeof auth !== 'string') return auth

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.users)) {
    return NextResponse.json({ code: 'MISSING_CREDENTIALS' }, { status: 400 })
  }

  const rows: ImportRow[] = body.users
  const failed: FailedRow[] = []
  const seenUsernames = new Set<string>()
  let created = 0

  for (let i = 0; i < rows.length; i++) {
    const { username, password, role, created_by, created_at } = rows[i] ?? {}
    const usernameStr = String(username ?? '').trim()

    const missingFields: string[] = []
    if (!usernameStr) missingFields.push('username')
    if (!password) missingFields.push('password')
    if (!role) missingFields.push('role')
    if (missingFields.length) {
      failed.push({ index: i + 1, username: usernameStr || `row ${i + 1}`, code: 'IMPORT_MISSING_FIELDS', fields: missingFields })
      continue
    }

    if (!VALID_ROLES.includes(role as UserRole)) {
      failed.push({ index: i + 1, username: usernameStr, code: 'IMPORT_INVALID_ROLE' })
      continue
    }

    if (!PASSWORD_REGEX.test(password)) {
      failed.push({ index: i + 1, username: usernameStr, code: 'IMPORT_INVALID_PASSWORD' })
      continue
    }

    if (seenUsernames.has(usernameStr)) {
      failed.push({ index: i + 1, username: usernameStr, code: 'IMPORT_USERNAME_DUPLICATE' })
      continue
    }

    if (usersDb.findByUsername(usernameStr)) {
      failed.push({ index: i + 1, username: usernameStr, code: 'IMPORT_USERNAME_TAKEN' })
      continue
    }

    const createdByStr = created_by ? String(created_by).trim() : null
    const creator = createdByStr ? usersDb.findByUsername(createdByStr) : null
    if (createdByStr && (!creator || creator.role !== 'admin')) {
      failed.push({ index: i + 1, username: usernameStr, code: 'IMPORT_INVALID_CREATOR' })
      continue
    }

    const createdAtStr = created_at ? String(created_at).trim() : null
    if (createdAtStr) {
      const ts = new Date(createdAtStr).getTime()
      if (isNaN(ts) || ts > Date.now()) {
        failed.push({ index: i + 1, username: usernameStr, code: 'IMPORT_INVALID_DATE' })
        continue
      }
    }

    const createdAtTs = createdAtStr ? new Date(createdAtStr).getTime() : undefined
    const hash = await bcrypt.hash(password, 10)
    usersDb.create({
      id: randomUUID(),
      username: usernameStr,
      password: hash,
      role: role as UserRole,
      created_by: creator?.id ?? auth,
      created_at: createdAtTs,
    })
    seenUsernames.add(usernameStr)
    created++
  }

  return NextResponse.json({ created, failed })
}
