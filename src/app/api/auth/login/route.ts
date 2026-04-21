import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth'
import { TOKEN_MAX_TIME, REFRESH_TOKEN_MAX_TIME } from '@/config/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ code: 'MISSING_CREDENTIALS' }, { status: 400 })
  }

  try {
    const { accessToken, refreshToken } = await authService.login(username, password)

    const response = NextResponse.json({ code: 'LOGIN' })

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    }

    response.cookies.set('token', accessToken, {
      ...cookieOptions,
      maxAge: TOKEN_MAX_TIME,
    })

    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_TIME,
    })

    return response
  } catch {
    return NextResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 })
  }
}
