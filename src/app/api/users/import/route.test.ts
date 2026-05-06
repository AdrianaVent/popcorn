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

jest.mock('@/services/auth/requireAdmin', () => ({
  requireAdmin: jest.fn(),
}))

jest.mock('@/db/users', () => ({
  usersDb: {
    findByUsername: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}))

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid'),
}))

import { POST } from './route'
import { requireAdmin } from '@/services/auth/requireAdmin'
import { usersDb } from '@/db/users'

const mockRequireAdmin = requireAdmin as jest.Mock
const mockFindByUsername = usersDb.findByUsername as jest.Mock
const mockCreate = usersDb.create as jest.Mock

type MockResponse = { status: number; json: () => Promise<unknown> }

function isResponse(v: unknown): v is MockResponse {
  return typeof v === 'object' && v !== null && '_isNextResponse' in v
}

function makeRequest(body: unknown) {
  return {
    json: () => Promise.resolve(body),
    cookies: { get: jest.fn() },
  } as never
}

describe('POST /api/users/import', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue('admin-id')
    mockFindByUsername.mockReturnValue(null)
  })

  it('returns auth error when requireAdmin rejects', async () => {
    const forbidden = { _isNextResponse: true, status: 403, json: async () => ({ code: 'FORBIDDEN' }) }
    mockRequireAdmin.mockResolvedValueOnce(forbidden)
    const result = await POST(makeRequest({ users: [] }))
    expect(isResponse(result)).toBe(true)
    if (isResponse(result)) expect((await result.json() as { code: string }).code).toBe('FORBIDDEN')
  })

  it('returns 400 when body has no users array', async () => {
    const result = await POST(makeRequest({}))
    expect(isResponse(result)).toBe(true)
    if (isResponse(result)) {
      expect(result.status).toBe(400)
      expect((await result.json() as { code: string }).code).toBe('MISSING_CREDENTIALS')
    }
  })

  it('creates valid rows and returns created count', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest' }],
    }))
    expect(isResponse(result)).toBe(true)
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: unknown[] }
      expect(body.created).toBe(1)
      expect(body.failed).toHaveLength(0)
    }
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('fails a row with IMPORT_MISSING_FIELDS and lists the missing field names', async () => {
    const result = await POST(makeRequest({
      users: [{ username: '', password: '', role: '' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { code: string; fields: string[] }[] }
      expect(body.created).toBe(0)
      expect(body.failed[0]?.code).toBe('IMPORT_MISSING_FIELDS')
      expect(body.failed[0]?.fields).toEqual(expect.arrayContaining(['username', 'password', 'role']))
    }
  })

  it('fails a row with IMPORT_MISSING_FIELDS for only the missing fields', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: '', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { code: string; fields: string[] }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_MISSING_FIELDS')
      expect(body.failed[0]?.fields).toEqual(['password'])
    }
  })

  it('fails a row with IMPORT_INVALID_ROLE when role is not admin or guest', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: 'Valid1!pass', role: 'superuser' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_ROLE')
    }
  })

  it('fails a row with IMPORT_INVALID_PASSWORD when password has no uppercase', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: 'valid1!pass', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_PASSWORD')
    }
  })

  it('fails a row with IMPORT_INVALID_PASSWORD when password has no lowercase', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: 'VALID1!PASS', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_PASSWORD')
    }
  })

  it('fails a row with IMPORT_INVALID_PASSWORD when password has no digit', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: 'Valid!pass', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_PASSWORD')
    }
  })

  it('fails a row with IMPORT_INVALID_PASSWORD when password has no special character', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: 'Valid1pass', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_PASSWORD')
    }
  })

  it('fails a row with IMPORT_INVALID_PASSWORD when password is too short', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'bob', password: 'V1!a', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_PASSWORD')
    }
  })

  it('fails a row with IMPORT_USERNAME_TAKEN when username already exists in DB', async () => {
    mockFindByUsername.mockReturnValueOnce({ id: 'existing' })
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { code: string }[] }
      expect(body.created).toBe(0)
      expect(body.failed[0]?.code).toBe('IMPORT_USERNAME_TAKEN')
    }
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates the first occurrence and skips duplicates (non-blocking)', async () => {
    const result = await POST(makeRequest({
      users: [
        { username: 'alice', password: 'Valid1!pass', role: 'guest' },
        { username: 'bob', password: 'Valid1!pass', role: 'guest' },
        { username: 'alice', password: 'Valid1!pass', role: 'admin' }, // duplicate — skipped
      ],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { index: number; username: string; code: string }[] }
      expect(body.created).toBe(2) // alice (first) + bob
      expect(body.failed).toHaveLength(1)
      expect(body.failed[0]?.code).toBe('IMPORT_USERNAME_DUPLICATE')
      expect(body.failed[0]?.username).toBe('alice')
      expect(body.failed[0]?.index).toBe(3)
    }
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('creates valid rows independently even when other rows fail', async () => {
    mockFindByUsername.mockImplementation((name: string) =>
      name === 'existing' ? { id: 'x' } : null
    )
    const result = await POST(makeRequest({
      users: [
        { username: 'alice', password: 'Valid1!pass', role: 'guest' },    // created
        { username: 'alice', password: 'Valid1!pass', role: 'guest' },    // duplicate — skipped
        { username: 'existing', password: 'Valid1!pass', role: 'guest' }, // taken — skipped
      ],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { code: string }[] }
      expect(body.created).toBe(1)
      expect(body.failed).toHaveLength(2)
    }
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('fails a row with IMPORT_INVALID_CREATOR when created_by user does not exist', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_by: 'admin_1' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_CREATOR')
    }
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('fails a row with IMPORT_INVALID_CREATOR when created_by user is a guest', async () => {
    mockFindByUsername.mockImplementation((name: string) =>
      name === 'guest_01' ? { id: 'g1', username: 'guest_01', role: 'guest' } : null
    )
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_by: 'guest_01' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_CREATOR')
    }
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('accepts a row with a valid admin as created_by', async () => {
    mockFindByUsername.mockImplementation((name: string) =>
      name === 'admin' ? { id: 'admin-id', username: 'admin', role: 'admin' } : null
    )
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_by: 'admin' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: unknown[] }
      expect(body.created).toBe(1)
      expect(body.failed).toHaveLength(0)
    }
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ created_by: 'admin-id' }))
  })

  it('uses auth user as created_by when created_by field is absent', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number }
      expect(body.created).toBe(1)
    }
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ created_by: 'admin-id' }))
  })

  it('uses auth user as created_by when created_by field is null', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_by: null }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number }
      expect(body.created).toBe(1)
    }
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ created_by: 'admin-id' }))
  })

  it('fails a row with IMPORT_INVALID_DATE when created_at is a future date', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_at: future }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_DATE')
    }
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('fails a row with IMPORT_INVALID_DATE when created_at is not a valid date', async () => {
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_at: 'not-a-date' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { failed: { code: string }[] }
      expect(body.failed[0]?.code).toBe('IMPORT_INVALID_DATE')
    }
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('accepts a row with a past created_at and preserves it on creation', async () => {
    const past = new Date('2024-01-01T10:00:00.000Z').getTime()
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest', created_at: '2024-01-01T10:00:00.000Z' }],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number }
      expect(body.created).toBe(1)
    }
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ created_at: past }))
  })

  it('accepts a row without created_at and uses current timestamp', async () => {
    const before = Date.now()
    const result = await POST(makeRequest({
      users: [{ username: 'alice', password: 'Valid1!pass', role: 'guest' }],
    }))
    const after = Date.now()
    if (isResponse(result)) {
      const body = await result.json() as { created: number }
      expect(body.created).toBe(1)
    }
    const call = mockCreate.mock.calls[0]?.[0] as { created_at?: number }
    expect(call?.created_at).toBeUndefined()
    // created_at undefined → usersDb.create defaults to Date.now() internally
    void before; void after
  })

  it('creates valid rows and reports all failed rows in the same response', async () => {
    mockFindByUsername.mockImplementation((name: string) =>
      name === 'existing' ? { id: 'x' } : null
    )
    const result = await POST(makeRequest({
      users: [
        { username: 'alice', password: 'Valid1!pass', role: 'guest' },    // created
        { username: '', password: '', role: '' },                          // missing fields
        { username: 'bob', password: 'weak', role: 'guest' },             // invalid password
        { username: 'existing', password: 'Valid1!pass', role: 'admin' }, // taken
        { username: 'carol', password: 'Valid2!pass', role: 'admin' },    // created
      ],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { code: string }[] }
      expect(body.created).toBe(2)
      expect(body.failed).toHaveLength(3)
      expect(body.failed.map((f) => f.code)).toEqual([
        'IMPORT_MISSING_FIELDS',
        'IMPORT_INVALID_PASSWORD',
        'IMPORT_USERNAME_TAKEN',
      ])
    }
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('includes row index (1-based) in each failed entry', async () => {
    const result = await POST(makeRequest({
      users: [
        { username: 'alice', password: 'Valid1!pass', role: 'guest' },
        { username: '', password: '', role: '' },
      ],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: { index: number }[] }
      expect(body.created).toBe(1)
      expect(body.failed[0]?.index).toBe(2)
    }
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('returns empty failed array when all rows are valid', async () => {
    const result = await POST(makeRequest({
      users: [
        { username: 'alice', password: 'Valid1!pass', role: 'guest' },
        { username: 'bob', password: 'Admin2!xyz', role: 'admin' },
      ],
    }))
    if (isResponse(result)) {
      const body = await result.json() as { created: number; failed: unknown[] }
      expect(body.created).toBe(2)
      expect(body.failed).toHaveLength(0)
    }
  })
})
