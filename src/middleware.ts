import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { JWT_SECRET_BYTES } from '@/config/auth'

const AUTH_ROUTES = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) return NextResponse.next()

  const token = req.cookies.get('token')?.value
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  if (!token) {
    if (isAuthRoute) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, JWT_SECRET_BYTES)
  } catch {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.set('token', '', { path: '/', maxAge: 0 })
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 })
    return response
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/movies', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
