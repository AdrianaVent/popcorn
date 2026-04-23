'use client'

import { useReducer, useEffect, type DependencyList } from 'react'

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

type Action = { type: 'start' } | { type: 'success'; data: unknown } | { type: 'error'; error: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reducer(_: AsyncState<any>, action: Action): AsyncState<any> {
  switch (action.type) {
    case 'start':   return { data: null, loading: true, error: null }
    case 'success': return { data: action.data, loading: false, error: null }
    case 'error':   return { data: null, loading: false, error: action.error }
  }
}

/**
 * Generic async data fetching hook.
 * When fetcher() returns null, the effect is skipped (useful for conditional fetches).
 * The caller is responsible for including all variables captured by fetcher in deps.
 */
export function useAsync<T>(
  fetcher: () => Promise<T> | null,
  deps: DependencyList,
): AsyncState<T> {
  const [state, dispatch] = useReducer(reducer, { data: null, loading: false, error: null })

  useEffect(() => {
    const promise = fetcher()
    if (!promise) return

    let cancelled = false
    dispatch({ type: 'start' })
    promise
      .then((data) => { if (!cancelled) dispatch({ type: 'success', data }) })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', error: 'TMDB_FETCH_ERROR' })
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state as AsyncState<T>
}
