import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { usersDb, type UserRole } from '@/db/users'
import { JWT_SECRET_BYTES, TOKEN_MAX_TIME, REFRESH_TOKEN_MAX_TIME } from '@/config/auth'

export type LoginResult = {
  accessToken: string
  refreshToken: string
  userId: string
  role: UserRole
}

export type RefreshResult = {
  accessToken: string
  refreshToken: string
}

async function signAccessToken(userId: string, username: string, role: UserRole): Promise<string> {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_TIME}s`)
    .sign(JWT_SECRET_BYTES)
}

async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_MAX_TIME}s`)
    .sign(JWT_SECRET_BYTES)
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResult> => {
    const user = usersDb.findByUsername(username)
    if (!user) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new Error('Invalid credentials')

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id, user.username, user.role),
      signRefreshToken(user.id),
    ])

    return { accessToken, refreshToken, userId: user.id, role: user.role }
  },

  refresh: async (refreshToken: string): Promise<RefreshResult> => {
    const { payload } = await jwtVerify(refreshToken, JWT_SECRET_BYTES)
    const userId = payload.sub as string

    const user = usersDb.findById(userId)
    if (!user) throw new Error('User not found')

    const [accessToken, newRefreshToken] = await Promise.all([
      signAccessToken(user.id, user.username, user.role),
      signRefreshToken(user.id),
    ])

    return { accessToken, refreshToken: newRefreshToken }
  },
}
