import type { NextResponse } from 'next/server'
import { TOKEN_MAX_TIME, REFRESH_TOKEN_MAX_TIME } from '@/config/auth'

type AuthTokens = { accessToken: string; refreshToken: string }

const BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export function setAuthCookies(response: NextResponse, { accessToken, refreshToken }: AuthTokens): void {
  response.cookies.set('token', accessToken, { ...BASE_OPTIONS, maxAge: TOKEN_MAX_TIME })
  response.cookies.set('refresh_token', refreshToken, { ...BASE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_TIME })
}
