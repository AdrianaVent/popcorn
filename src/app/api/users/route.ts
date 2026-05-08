import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { usersDb } from '@/db/users'
import { requireAdmin } from '@/services/auth/requireAdmin'
import type { PublicUser } from '@/types/user'

function toPublic(u: NonNullable<ReturnType<typeof usersDb.findById>>): PublicUser {
  return { id: u.id, username: u.username, role: u.role, created_at: u.created_at, created_by: u.created_by }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? 20))
  const filters = {
    username: searchParams.get('username') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    created_after: searchParams.get('created_after') ?? undefined,
    created_by: searchParams.get('created_by') ?? undefined,
  }

  const { users, total } = usersDb.findPaginated(page, pageSize, filters)
  const creators = usersDb.findCreators()
  return NextResponse.json({
    users: users.map(toPublic),
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    totalResults: total,
    creators,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { username, password, role } = await req.json()

  if (!username || !password || !['admin', 'guest'].includes(role)) {
    return NextResponse.json({ code: 'MISSING_CREDENTIALS' }, { status: 400 })
  }

  if (usersDb.findByUsername(username)) {
    return NextResponse.json({ code: 'USERNAME_TAKEN' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 10)
  const user = usersDb.create({ id: randomUUID(), username, password: hash, role, created_by: auth })
  return NextResponse.json(toPublic({ ...user, password: hash }), { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ code: 'MISSING_IDS' }, { status: 400 })
  }

  // Prevent admin from deleting themselves
  const safeIds = (ids as string[]).filter((id) => id !== auth)
  if (safeIds.length) usersDb.deleteMany(safeIds)
  return NextResponse.json({ code: 'DELETED' })
}
