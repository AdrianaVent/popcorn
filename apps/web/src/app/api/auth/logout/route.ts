import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ code: 'LOGOUT' })

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }

  response.cookies.set('token', '', cookieOptions)
  response.cookies.set('refresh_token', '', cookieOptions)

  return response
}
