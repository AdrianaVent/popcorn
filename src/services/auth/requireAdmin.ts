import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { JWT_SECRET_BYTES } from '@/config/auth'

// Returns the userId string if the request is from a verified admin,
// or a NextResponse error to return early from the Route Handler.
export async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES)
    if (payload.role !== 'admin') {
      return NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 })
    }
    return payload.sub as string
  } catch {
    return NextResponse.json({ code: 'SESSION_EXPIRED' }, { status: 401 })
  }
}
