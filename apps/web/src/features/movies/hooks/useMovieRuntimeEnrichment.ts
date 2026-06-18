'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchMovieDetail } from '@/features/movies/movies.service'
import type { MovieRow } from '@/types/movie'

export function useMovieRuntimeEnrichment(movies: MovieRow[], language: string): Map<number, number | null> {
  const [runtimes, setRuntimes] = useState<Map<number, number | null>>(new Map())
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!movies.length) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    Promise.allSettled(
      movies.map((m) => fetchMovieDetail(m.id, language))
    ).then((results) => {
      if (controller.signal.aborted) return
      const next = new Map<number, number | null>()
      results.forEach((result, i) => {
        next.set(
          movies[i].id,
          result.status === 'fulfilled' ? (result.value?.runtime ?? null) : null,
        )
      })
      setRuntimes(next)
    })

    return () => { controller.abort() }
  }, [movies, language])

  return runtimes
}
