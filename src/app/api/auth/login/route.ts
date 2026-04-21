import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth'
import { TOKEN_MAX_TIME } from '@/config/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json(
      { message: 'Username and password are required' },
      { status: 400 }
    )
  }

  try {
    const { accessToken } = await authService.login(username, password)

    const response = NextResponse.json({ message: 'Login successful' })

    response.cookies.set('token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: TOKEN_MAX_TIME,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    )
  }
}
