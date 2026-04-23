import { NextRequest, NextResponse } from 'next/server'

const AUTH_ROUTES = ['/login', '/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) return NextResponse.next()

  const token = req.cookies.get('token')?.value

  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  if (!isAuthRoute && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/movies', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
