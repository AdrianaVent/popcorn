import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/services/auth/requireAdmin'
import { usersDb } from '@/db/users'

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req)
  if (result instanceof NextResponse) return result
  return NextResponse.json(usersDb.getStats())
}
