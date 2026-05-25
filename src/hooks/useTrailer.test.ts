import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { pickYouTubeTrailer, useTrailer, findSeasonTrailerInList, filterNonSeasonTrailers, resolveSeasonFallback, resolveHeaderTrailer, useEnrichedTrailers } from './useTrailer'
import type { TMDBVideo, TMDBVideosResult } from '@/types/tmdb'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

function makeVideo(overrides: Partial<TMDBVideo>): TMDBVideo {
  return {
    id: 'v1',
    key: 'abc123',
    name: 'Official Trailer',
    site: 'YouTube',
    type: 'Trailer',
    official: true,
    iso_639_1: 'en',
    ...overrides,
  }
}

function makeResult(videos: TMDBVideo[]): TMDBVideosResult {
  return { results: videos }
}

// ─── findSeasonTrailerInList ──────────────────────────────────────────────────

describe('findSeasonTrailerInList', () => {
  it('returns null for an empty list', () => {
    expect(findSeasonTrailerInList([], 1)).toBeNull()
  })

  it('matches "Season X" in the trailer name', () => {
    const t1 = makeVideo({ key: 's1', name: 'The Show — Season 1 Official Trailer' })
    const t2 = makeVideo({ key: 's2', name: 'The Show — Season 2 Official Trailer' })
    expect(findSeasonTrailerInList([t1, t2], 1)?.key).toBe('s1')
    expect(findSeasonTrailerInList([t1, t2], 2)?.key).toBe('s2')
  })

  it('matches "Temporada X" in the trailer name', () => {
    const t = makeVideo({ key: 'es1', name: 'La Serie | Temporada 1 Tráiler Oficial' })
    expect(findSeasonTrailerInList([t], 1)?.key).toBe('es1')
  })

  it('is case-insensitive', () => {
    const t = makeVideo({ key: 'ci', name: 'season 3 trailer' })
    expect(findSeasonTrailerInList([t], 3)?.key).toBe('ci')
  })

  it('returns null when no trailer matches the season number', () => {
    const t = makeVideo({ key: 's1', name: 'Season 1 Trailer' })
    expect(findSeasonTrailerInList([t], 2)).toBeNull()
  })
})

// ─── filterNonSeasonTrailers ──────────────────────────────────────────────────

describe('filterNonSeasonTrailers', () => {
  it('returns all trailers when none have a season pattern', () => {
    const trailers = [
      makeVideo({ key: 'a', name: 'Official Trailer' }),
      makeVideo({ key: 'b', name: 'Final Trailer' }),
    ]
    expect(filterNonSeasonTrailers(trailers)).toHaveLength(2)
  })

  it('filters out trailers with "Season X" in the name', () => {
    const official = makeVideo({ key: 'off', name: 'Official Trailer' })
    const s1 = makeVideo({ key: 's1', name: 'Season 1 Trailer' })
    const s2 = makeVideo({ key: 's2', name: 'Season 2 Trailer' })
    expect(filterNonSeasonTrailers([official, s1, s2])).toEqual([official])
  })

  it('filters out trailers with "Temporada X" in the name', () => {
    const official = makeVideo({ key: 'off', name: 'Tráiler Oficial' })
    const t1 = makeVideo({ key: 't1', name: 'Temporada 1 Tráiler' })
    expect(filterNonSeasonTrailers([official, t1])).toEqual([official])
  })

  it('returns empty array when all trailers have a season pattern', () => {
    const trailers = [makeVideo({ name: 'Season 1 Trailer' }), makeVideo({ name: 'Season 2 Trailer' })]
    expect(filterNonSeasonTrailers(trailers)).toEqual([])
  })
})

// ─── resolveSeasonFallback ────────────────────────────────────────────────────

describe('resolveSeasonFallback', () => {
  const generic1 = makeVideo({ key: 'g1', name: 'Official Trailer' })
  const generic2 = makeVideo({ key: 'g2', name: 'Comic-Con Trailer' })
  const s1Named  = makeVideo({ key: 's1', name: 'Season 1 Official Trailer' })
  const s2Named  = makeVideo({ key: 's2', name: 'Season 2 Official Trailer' })
  const s1Es     = makeVideo({ key: 'es1', name: 'Temporada 1 Tráiler oficial' })

  it('returns null for an empty list', () => {
    expect(resolveSeasonFallback([], 1)).toBeNull()
  })

  it('returns the season-named trailer when name matches', () => {
    expect(resolveSeasonFallback([s1Named, s2Named], 1)?.key).toBe('s1')
    expect(resolveSeasonFallback([s1Named, s2Named], 2)?.key).toBe('s2')
  })

  it('matches "Temporada X" for Spanish-named trailers', () => {
    expect(resolveSeasonFallback([s1Es], 1)?.key).toBe('es1')
  })

  it('returns null when no trailer name matches the season number', () => {
    expect(resolveSeasonFallback([generic1, generic2], 1)).toBeNull()
    expect(resolveSeasonFallback([generic1, generic2], 2)).toBeNull()
  })

  it('prefers the season-named trailer and ignores generics', () => {
    expect(resolveSeasonFallback([generic1, s1Named], 1)?.key).toBe('s1')
  })
})

// ─── resolveHeaderTrailer ─────────────────────────────────────────────────────

describe('resolveHeaderTrailer', () => {
  const generic  = makeVideo({ key: 'g', name: 'Official Trailer' })
  const s1Named  = makeVideo({ key: 's1', name: 'Season 1 Official Trailer' })
  const s2Named  = makeVideo({ key: 's2', name: 'Season 2 Trailer' })

  it('returns null for an empty list', () => {
    expect(resolveHeaderTrailer([])).toBeNull()
  })

  it('returns the generic trailer when all trailers are generic', () => {
    // "The Man in the High Castle" / "Criminal Minds" case
    expect(resolveHeaderTrailer([generic])?.key).toBe('g')
  })

  it('returns null when all trailers are season-named', () => {
    // "Stranger Things" case: only "Season 1 Trailer X" entries
    expect(resolveHeaderTrailer([s1Named, s2Named])).toBeNull()
  })

  it('returns the generic trailer when mixed with season-named trailers', () => {
    expect(resolveHeaderTrailer([generic, s1Named, s2Named])?.key).toBe('g')
  })

  it('respects language preference when picking from generic trailers', () => {
    const enGeneric = makeVideo({ key: 'en', name: 'Official Trailer', iso_639_1: 'en' })
    const esGeneric = makeVideo({ key: 'es', name: 'Tráiler Oficial', iso_639_1: 'es' })
    expect(resolveHeaderTrailer([enGeneric, esGeneric, s1Named], 'es-ES')?.key).toBe('es')
    expect(resolveHeaderTrailer([enGeneric, esGeneric, s1Named], 'en-US')?.key).toBe('en')
  })
})

// ─── useEnrichedTrailers ──────────────────────────────────────────────────────

describe('useEnrichedTrailers', () => {
  const trailer1 = makeVideo({ key: 'key1', name: 'Official Trailer' })
  const trailer2 = makeVideo({ key: 'key2', name: 'Comic-Con Trailer' })

  function mockFetch(handler: (url: string) => { title: string } | null) {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      const body = handler(url)
      if (body) return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)
    }) as jest.Mock
  }

  afterEach(() => { delete (global as Record<string, unknown>).fetch })

  it('returns trailers unchanged while YouTube titles are loading', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
    const { result } = renderHook(
      () => useEnrichedTrailers([trailer1]),
      { wrapper: createWrapper() },
    )
    expect(result.current).toEqual([trailer1])
  })

  it('replaces TMDB name with YouTube title after fetch', async () => {
    mockFetch((url) => url.includes('key1') ? { title: 'The Show Season 1 - Official Trailer | Prime Video' } : null)
    const { result } = renderHook(
      () => useEnrichedTrailers([trailer1]),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current[0].name).not.toBe('Official Trailer'))
    expect(result.current[0].name).toBe('The Show Season 1 - Official Trailer | Prime Video')
    expect(result.current[0].key).toBe('key1')
  })

  it('keeps TMDB name when YouTube fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network error'))) as jest.Mock
    const { result } = renderHook(
      () => useEnrichedTrailers([trailer1]),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current).toBeDefined())
    expect(result.current[0].name).toBe('Official Trailer')
  })

  it('returns empty array when given empty input', () => {
    const { result } = renderHook(
      () => useEnrichedTrailers([]),
      { wrapper: createWrapper() },
    )
    expect(result.current).toEqual([])
  })

  it('enriches multiple trailers independently', async () => {
    mockFetch((url) => {
      if (url.includes('key1')) return { title: 'Season 1 Trailer' }
      if (url.includes('key2')) return { title: 'Season 2 Trailer' }
      return null
    })
    const { result } = renderHook(
      () => useEnrichedTrailers([trailer1, trailer2]),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current[0].name).toBe('Season 1 Trailer'))
    expect(result.current[1].name).toBe('Season 2 Trailer')
  })

  it('enables resolveSeasonFallback to match after enrichment', async () => {
    mockFetch((url) => url.includes('key1')
      ? { title: 'The Man in the High Castle Season 1 - Official Trailer | Prime Video' }
      : null)
    const { result } = renderHook(
      () => useEnrichedTrailers([trailer1]),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current[0].name).toContain('Season 1'))
    expect(resolveSeasonFallback(result.current, 1)?.key).toBe('key1')
    expect(resolveSeasonFallback(result.current, 2)).toBeNull()
  })
})

// ─── pickYouTubeTrailer ───────────────────────────────────────────────────────

describe('pickYouTubeTrailer', () => {
  it('returns null when there are no videos', () => {
    expect(pickYouTubeTrailer([])).toBeNull()
  })

  it('returns null when no YouTube trailers exist', () => {
    const videos = [
      makeVideo({ site: 'Vimeo' }),
      makeVideo({ site: 'YouTube', type: 'Clip' }),
    ]
    expect(pickYouTubeTrailer(videos)).toBeNull()
  })

  it('returns the first YouTube trailer when no language preference given', () => {
    const first = makeVideo({ key: 'first', iso_639_1: 'en' })
    const second = makeVideo({ key: 'second', iso_639_1: 'es' })
    expect(pickYouTubeTrailer([first, second])).toEqual(first)
  })

  it('prefers the trailer matching the preferred language', () => {
    const en = makeVideo({ key: 'en-key', iso_639_1: 'en' })
    const es = makeVideo({ key: 'es-key', iso_639_1: 'es' })
    expect(pickYouTubeTrailer([en, es], 'es-ES')).toEqual(es)
  })

  it('falls back to the first trailer when preferred language has no match', () => {
    const en = makeVideo({ key: 'en-key', iso_639_1: 'en' })
    expect(pickYouTubeTrailer([en], 'es-ES')).toEqual(en)
  })

  it('maps es-ES to iso es correctly', () => {
    const es = makeVideo({ key: 'es-key', iso_639_1: 'es' })
    const en = makeVideo({ key: 'en-key', iso_639_1: 'en' })
    const result = pickYouTubeTrailer([en, es], 'es-ES')
    expect(result?.key).toBe('es-key')
  })

  it('maps en-US to iso en correctly', () => {
    const es = makeVideo({ key: 'es-key', iso_639_1: 'es' })
    const en = makeVideo({ key: 'en-key', iso_639_1: 'en' })
    const result = pickYouTubeTrailer([es, en], 'en-US')
    expect(result?.key).toBe('en-key')
  })

  it('ignores non-Trailer types even if site is YouTube', () => {
    const clip = makeVideo({ type: 'Clip', key: 'clip-key' })
    const trailer = makeVideo({ type: 'Trailer', key: 'trailer-key' })
    expect(pickYouTubeTrailer([clip, trailer])?.key).toBe('trailer-key')
  })
})

// ─── useTrailer ───────────────────────────────────────────────────────────────

describe('useTrailer', () => {
  it('does not call fetcher when disabled', () => {
    const fetcher = jest.fn()
    renderHook(
      () => useTrailer(['test'], fetcher, false),
      { wrapper: createWrapper() },
    )
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns null trailer initially while loading', () => {
    const fetcher = jest.fn(() => new Promise<TMDBVideosResult>(() => {}))
    const { result } = renderHook(
      () => useTrailer(['test'], fetcher, true),
      { wrapper: createWrapper() },
    )
    expect(result.current.trailer).toBeNull()
  })

  it('returns the picked trailer after fetch resolves', async () => {
    const video = makeVideo({ key: 'xyz' })
    const fetcher = jest.fn().mockResolvedValue(makeResult([video]))
    const { result } = renderHook(
      () => useTrailer(['test-resolved'], fetcher, true),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.trailer).not.toBeNull())
    expect(result.current.trailer?.key).toBe('xyz')
  })

  it('returns null trailer when fetcher returns no YouTube trailers', async () => {
    const fetcher = jest.fn().mockResolvedValue(makeResult([makeVideo({ site: 'Vimeo' })]))
    const { result } = renderHook(
      () => useTrailer(['test-empty'], fetcher, true),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.trailer).toBeNull()
  })

  it('passes language preference to pickYouTubeTrailer', async () => {
    const es = makeVideo({ key: 'es-key', iso_639_1: 'es' })
    const en = makeVideo({ key: 'en-key', iso_639_1: 'en' })
    const fetcher = jest.fn().mockResolvedValue(makeResult([en, es]))
    const { result } = renderHook(
      () => useTrailer(['test-lang'], fetcher, true, 'es-ES'),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.trailer).not.toBeNull())
    expect(result.current.trailer?.key).toBe('es-key')
  })

  it('returns empty allTrailers initially while loading', () => {
    const fetcher = jest.fn(() => new Promise<TMDBVideosResult>(() => {}))
    const { result } = renderHook(
      () => useTrailer(['test-all-loading'], fetcher, true),
      { wrapper: createWrapper() },
    )
    expect(result.current.allTrailers).toEqual([])
  })

  it('returns all YouTube trailers in allTrailers after fetch resolves', async () => {
    const t1 = makeVideo({ key: 'key-1', iso_639_1: 'en' })
    const t2 = makeVideo({ key: 'key-2', iso_639_1: 'es' })
    const clip = makeVideo({ key: 'clip-key', type: 'Clip' })
    const fetcher = jest.fn().mockResolvedValue(makeResult([t1, t2, clip]))
    const { result } = renderHook(
      () => useTrailer(['test-all-resolved'], fetcher, true),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.allTrailers.length).toBeGreaterThan(0))
    expect(result.current.allTrailers.map((v) => v.key)).toEqual(['key-1', 'key-2'])
  })

  it('returns empty allTrailers when no YouTube trailers exist', async () => {
    const fetcher = jest.fn().mockResolvedValue(makeResult([makeVideo({ site: 'Vimeo' })]))
    const { result } = renderHook(
      () => useTrailer(['test-all-empty'], fetcher, true),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.allTrailers).toEqual([])
  })
})
