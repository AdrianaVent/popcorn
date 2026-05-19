import { tmdbFetch } from './client'

const mockFetch = jest.fn()
global.fetch = mockFetch

const ok = (data: unknown) => ({
  ok: true,
  json: () => Promise.resolve(data),
})

const fail = (status: number) => ({ ok: false, status })

describe('tmdbFetch', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns parsed JSON on success', async () => {
    const data = { results: [] }
    mockFetch.mockResolvedValueOnce(ok(data))
    await expect(tmdbFetch('/test')).resolves.toEqual(data)
  })

  it('throws TMDB_UNAUTHORIZED on 401', async () => {
    mockFetch.mockResolvedValueOnce(fail(401))
    await expect(tmdbFetch('/test')).rejects.toMatchObject({
      message: 'TMDB_UNAUTHORIZED',
      code: 'TMDB_UNAUTHORIZED',
      status: 401,
    })
  })

  it('throws TMDB_NOT_FOUND on 404', async () => {
    mockFetch.mockResolvedValueOnce(fail(404))
    await expect(tmdbFetch('/test')).rejects.toMatchObject({
      message: 'TMDB_NOT_FOUND',
      code: 'TMDB_NOT_FOUND',
    })
  })

  it('throws TMDB_RATE_LIMIT on 429', async () => {
    mockFetch.mockResolvedValueOnce(fail(429))
    await expect(tmdbFetch('/test')).rejects.toMatchObject({
      message: 'TMDB_RATE_LIMIT',
      code: 'TMDB_RATE_LIMIT',
    })
  })

  it('throws TMDB_FETCH_ERROR for other HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce(fail(500))
    await expect(tmdbFetch('/test')).rejects.toMatchObject({
      message: 'TMDB_FETCH_ERROR',
      code: 'TMDB_FETCH_ERROR',
    })
  })

  it('appends the API key to the request URL', async () => {
    mockFetch.mockResolvedValueOnce(ok({}))
    await tmdbFetch('/test')
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('api_key=test-key')
  })

  it('sets the default language param', async () => {
    mockFetch.mockResolvedValueOnce(ok({}))
    await tmdbFetch('/test')
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('language=es-ES')
  })

  it('overrides default language when passed in params', async () => {
    mockFetch.mockResolvedValueOnce(ok({}))
    await tmdbFetch('/test', { language: 'en-US' })
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('language=en-US')
  })

  it('appends additional params to the URL', async () => {
    mockFetch.mockResolvedValueOnce(ok({}))
    await tmdbFetch('/test', { page: 3 })
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('page=3')
  })

  it('keeps | unencoded so TMDB parses OR filters correctly', async () => {
    mockFetch.mockResolvedValueOnce(ok({}))
    await tmdbFetch('/test', { with_original_language: 'en|es' })
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('with_original_language=en|es')
    expect(url).not.toContain('%7C')
  })
})
