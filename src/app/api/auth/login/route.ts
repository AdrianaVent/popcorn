import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth'
import { setAuthCookies } from '@/services/auth/cookies'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ code: 'MISSING_CREDENTIALS' }, { status: 400 })
    }

    const { accessToken, refreshToken, userId, username: user, role, avatar } = await authService.login(username, password)

    const response = NextResponse.json({ code: 'LOGIN', userId, username: user, role, avatar })
    setAuthCookies(response, { accessToken, refreshToken })
    return response
  } catch {
    return NextResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 })
  }
}
