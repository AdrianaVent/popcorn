/*
 * API KEY EXPOSURE WARNING
 * Using NEXT_PUBLIC_ prefix makes this key visible in the browser bundle.
 * Alternatives to keep it server-side only:
 *
 * 1. Next.js Server Components (recommended for this stack)
 *    Move all TMDB calls to Server Components using `process.env.TMDB_API_KEY`
 *    (no NEXT_PUBLIC_ prefix). The key never reaches the client. Zero extra setup.
 *
 * 2. Next.js Route Handlers (src/app/api/)
 *    Create proxy endpoints that call TMDB server-side. The frontend calls
 *    /api/movies instead of TMDB directly. More boilerplate, but works with
 *    any component type and allows caching/rate-limiting logic.
 *
 * 3. Keep NEXT_PUBLIC_ (current approach)
 *    Acceptable for personal projects — TMDB read-only tokens have no write
 *    access and TMDB explicitly supports client-side usage.
 */

import { DEFAULT_LANGUAGE } from '@/config/constants'
import { TMDB_BASE_URL, TMDB_API_KEY } from '@/services/tmdb/config'

export async function tmdbFetch<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  url.searchParams.set('language', DEFAULT_LANGUAGE)

  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
  }

  const res = await fetch(url.toString())

  if (!res.ok) {
    const code =
      res.status === 401 ? 'TMDB_UNAUTHORIZED' :
      res.status === 404 ? 'TMDB_NOT_FOUND' :
      res.status === 429 ? 'TMDB_RATE_LIMIT' :
      'TMDB_FETCH_ERROR'

    const error = new Error(code) as Error & { code: string; status: number }
    error.code = code
    error.status = res.status
    throw error
  }

  return res.json() as Promise<T>
}
