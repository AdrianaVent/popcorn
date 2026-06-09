jest.mock('next/server', () => {
  class NextResponse {
    readonly status: number
    private readonly body: unknown
    constructor(body: unknown, init?: { status?: number }) {
      this.status = init?.status ?? 200
      this.body = body
    }
    async json() { return this.body }
    static json(body: unknown, init?: { status?: number }) {
      return new NextResponse(body, init)
    }
  }
  return { NextRequest: jest.fn(), NextResponse }
})

jest.mock('@/services/auth/requireAdmin', () => ({
  requireAdmin: jest.fn(),
}))

jest.mock('@/db/users', () => ({
  usersDb: {
    getStats: jest.fn(),
  },
}))

import { GET } from './route'
import { requireAdmin } from '@/services/auth/requireAdmin'
import { usersDb } from '@/db/users'
import { NextResponse } from 'next/server'

const mockRequireAdmin = jest.mocked(requireAdmin)
const mockGetStats     = jest.mocked(usersDb.getStats)

type Res = { status: number; json: () => Promise<unknown> }

const MOCK_STATS = {
  total: 10, guests: 7, admins: 3, thisMonth: 2,
  byMonth: [{ month: '2026-06', count: 2 }],
  byWeek:  [{ start: 1000, count: 1 }],
  byDay:   [{ start: 2000, count: 0 }],
}

beforeEach(() => jest.clearAllMocks())

describe('GET /api/users/stats', () => {
  it('returns the error response from requireAdmin when not admin', async () => {
    // Use NextResponse.json so the instance passes instanceof check in the route
    mockRequireAdmin.mockResolvedValue(
      NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 }) as unknown as string,
    )

    const req = {} as Parameters<typeof GET>[0]
    const res = await GET(req) as unknown as Res

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ code: 'FORBIDDEN' })
    expect(mockGetStats).not.toHaveBeenCalled()
  })

  it('returns stats when admin', async () => {
    mockRequireAdmin.mockResolvedValue('admin-user-id')
    mockGetStats.mockReturnValue(MOCK_STATS)

    const req = {} as Parameters<typeof GET>[0]
    const res = await GET(req) as unknown as Res

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(MOCK_STATS)
    expect(mockGetStats).toHaveBeenCalledTimes(1)
  })

  it('passes the request to requireAdmin', async () => {
    mockRequireAdmin.mockResolvedValue('admin-user-id')
    mockGetStats.mockReturnValue(MOCK_STATS)

    const req = { cookies: {} } as Parameters<typeof GET>[0]
    await GET(req)

    expect(mockRequireAdmin).toHaveBeenCalledWith(req)
  })

  it('returns 401 when requireAdmin returns unauthorized response', async () => {
    mockRequireAdmin.mockResolvedValue(
      NextResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }) as unknown as string,
    )

    const req = {} as Parameters<typeof GET>[0]
    const res = await GET(req) as unknown as Res

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ code: 'UNAUTHORIZED' })
  })
})
