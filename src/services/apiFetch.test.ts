const mockFetch = jest.fn()
global.fetch = mockFetch

import { apiFetch } from './apiFetch'

function makeResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('apiFetch', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns the response when the request succeeds', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: 1 }))
    const res = await apiFetch('/api/users')
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns non-401 error responses without retrying', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(403))
    const res = await apiFetch('/api/users')
    expect(res.status).toBe(403)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries the original request after a successful refresh on 401', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(200))
      .mockResolvedValueOnce(makeResponse(200, { retried: true }))
    const res = await apiFetch('/api/users')
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/auth/refresh', { method: 'POST' })
  })

  it('throws SESSION_EXPIRED and does not retry when refresh fails on 401', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(401))
    await expect(apiFetch('/api/users')).rejects.toThrow('SESSION_EXPIRED')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws SESSION_EXPIRED when the refresh call itself throws', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse(401))
      .mockRejectedValueOnce(new Error('network'))
    await expect(apiFetch('/api/users')).rejects.toThrow('SESSION_EXPIRED')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('passes url and options through to fetch unchanged', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200))
    await apiFetch('/api/users', { method: 'POST', body: 'x' })
    expect(mockFetch).toHaveBeenCalledWith('/api/users', { method: 'POST', body: 'x' })
  })
})

