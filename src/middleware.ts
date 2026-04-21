import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard']
const AUTH_ROUTES = ['/login', '/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
