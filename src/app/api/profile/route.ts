import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { usersDb } from '@/db/users'
import { JWT_SECRET_BYTES } from '@/config/auth'
import { serializeAvatar, type AvatarOptions } from '@/config/avatars'

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES)
    return payload.sub as string
  } catch {
    return null
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })

  const user = usersDb.findById(userId)
  if (!user) return NextResponse.json({ code: 'USER_NOT_FOUND' }, { status: 404 })

  const body = await req.json() as { avatar?: AvatarOptions; currentPassword?: string; newPassword?: string }

  if (body.avatar) {
    usersDb.update(userId, { avatar: serializeAvatar(body.avatar) })
    return NextResponse.json({ code: 'PROFILE_UPDATED' })
  }

  if (body.currentPassword !== undefined && body.newPassword !== undefined) {
    const valid = await bcrypt.compare(body.currentPassword, user.password)
    if (!valid) return NextResponse.json({ code: 'WRONG_PASSWORD' }, { status: 400 })
    if (!PASSWORD_REGEX.test(body.newPassword)) {
      return NextResponse.json({ code: 'PASSWORD_TOO_WEAK' }, { status: 400 })
    }
    const hashed = await bcrypt.hash(body.newPassword, 10)
    usersDb.update(userId, { password: hashed })
    return NextResponse.json({ code: 'PASSWORD_CHANGED' })
  }

  return NextResponse.json({ code: 'NOTHING_TO_UPDATE' }, { status: 400 })
}
