import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { pickYouTubeTrailer, useTrailer } from './useTrailer'
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
})
