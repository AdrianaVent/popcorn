import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { usersDb } from '@/db/users'
import { requireAdmin } from '@/services/auth/requireAdmin'
import type { PublicUser } from '@/types/user'

type Params = { params: Promise<{ id: string }> }

function toPublic(u: NonNullable<ReturnType<typeof usersDb.findById>>): PublicUser {
  return { id: u.id, username: u.username, role: u.role, created_at: u.created_at, created_by: u.created_by }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const user = usersDb.findById(id)
  if (!user) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })

  const { username, password, role } = await req.json()

  // Prevent admin from changing their own role
  if (id === auth && role && role !== user.role) {
    return NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 })
  }

  if (username && username !== user.username && usersDb.findByUsername(username)) {
    return NextResponse.json({ code: 'USERNAME_TAKEN' }, { status: 409 })
  }

  const fields: Parameters<typeof usersDb.update>[1] = {}
  if (username) fields.username = username
  if (password) fields.password = await bcrypt.hash(password, 10)
  if (role && ['admin', 'guest'].includes(role)) fields.role = role

  usersDb.update(id, fields)
  return NextResponse.json(toPublic({ ...user, ...fields, password: user.password }))
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  if (id === auth) return NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 })

  if (!usersDb.findById(id)) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })

  usersDb.deleteById(id)
  return NextResponse.json({ code: 'DELETED' })
}
