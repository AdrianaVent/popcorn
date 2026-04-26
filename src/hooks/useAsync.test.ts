import { renderHook, waitFor } from '@testing-library/react'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('starts with empty state when fetcher returns null', () => {
    const { result } = renderHook(() => useAsync(() => null, []))
    expect(result.current).toEqual({ data: null, loading: false, error: null })
  })

  it('sets loading immediately when a fetch starts', () => {
    const { result } = renderHook(() =>
      useAsync(() => new Promise(() => {}), []) // never resolves
    )
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('resolves data on success', async () => {
    const data = { id: 1, name: 'Inception' }
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve(data), [])
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(data)
    expect(result.current.error).toBeNull()
  })

  it('sets TMDB_FETCH_ERROR on failure', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(new Error('network error')), [])
    )

    await waitFor(() => expect(result.current.error).toBe('TMDB_FETCH_ERROR'))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('refetches when deps change', async () => {
    let id = 1
    const fetcher = jest.fn((i: number) => Promise.resolve({ id: i }))

    const { result, rerender } = renderHook(() =>
      useAsync(() => fetcher(id), [id])
    )

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }))
    expect(fetcher).toHaveBeenCalledTimes(1)

    id = 2
    rerender()

    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not update state after unmount', async () => {
    let resolve: (v: unknown) => void
    const promise = new Promise((r) => { resolve = r! })
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { unmount } = renderHook(() => useAsync(() => promise, []))
    unmount()
    resolve!({ data: 'late response' })

    // No "Can't perform a React state update on an unmounted component" warning
    await Promise.resolve()
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
