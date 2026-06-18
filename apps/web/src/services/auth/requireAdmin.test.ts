import { requireAdmin } from './requireAdmin'

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}))

jest.mock('@/config/auth', () => ({
  JWT_SECRET_BYTES: new Uint8Array(32),
}))

// Avoid importing next/server in jsdom — it requires Web API globals (Request)
jest.mock('next/server', () => {
  const makeResponse = (body: unknown, init?: { status?: number }) => ({
    _isNextResponse: true,
    status: init?.status ?? 200,
    json: () => Promise.resolve(body),
  })
  return {
    NextRequest: jest.fn(),
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => makeResponse(body, init),
    },
  }
})

import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

const mockJwtVerify = jwtVerify as jest.Mock

function makeRequest(token?: string) {
  return {
    cookies: {
      get: (name: string) => (name === 'token' && token ? { value: token } : undefined),
    },
  } as never
}

function isResponse(v: unknown): v is { status: number; json: () => Promise<{ code: string }> } {
  return typeof v === 'object' && v !== null && '_isNextResponse' in v
}

describe('requireAdmin', () => {
  beforeEach(() => mockJwtVerify.mockReset())

  it('returns 401 when no token cookie is present', async () => {
    const result = await requireAdmin(makeRequest())
    expect(isResponse(result)).toBe(true)
    if (isResponse(result)) {
      expect(result.status).toBe(401)
      expect((await result.json()).code).toBe('UNAUTHORIZED')
    }
  })

  it('returns 403 when token belongs to a guest', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'user-1', role: 'guest' } })
    const result = await requireAdmin(makeRequest('some-token'))
    expect(isResponse(result)).toBe(true)
    if (isResponse(result)) {
      expect(result.status).toBe(403)
      expect((await result.json()).code).toBe('FORBIDDEN')
    }
  })

  it('returns the userId string when token belongs to an admin', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'admin-42', role: 'admin' } })
    const result = await requireAdmin(makeRequest('valid-token'))
    expect(result).toBe('admin-42')
  })

  it('returns 401 SESSION_EXPIRED when jwtVerify throws', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('expired'))
    const result = await requireAdmin(makeRequest('bad-token'))
    expect(isResponse(result)).toBe(true)
    if (isResponse(result)) {
      expect(result.status).toBe(401)
      expect((await result.json()).code).toBe('SESSION_EXPIRED')
    }
  })
})

// Suppress unused import warning — NextResponse is referenced only to ensure the mock is typed
void NextResponse
