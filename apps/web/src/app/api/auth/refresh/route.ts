import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth'
import { setAuthCookies } from '@/services/auth/cookies'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ code: 'NO_REFRESH_TOKEN' }, { status: 401 })
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken)

    const response = NextResponse.json({ code: 'REFRESH' })
    setAuthCookies(response, { accessToken, refreshToken: newRefreshToken })
    return response
  } catch {
    const response = NextResponse.json({ code: 'SESSION_EXPIRED' }, { status: 401 })
    response.cookies.set('token', '', { path: '/', maxAge: 0 })
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })
    return response
  }
}
