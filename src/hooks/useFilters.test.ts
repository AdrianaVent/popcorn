import { renderHook, act } from '@testing-library/react'
import { useFilters } from './useFilters'

describe('useFilters', () => {
  it('returns the initial filters', () => {
    const { result } = renderHook(() => useFilters({ title: '', rating: 0 }))
    expect(result.current.filters).toEqual({ title: '', rating: 0 })
  })

  it('updates filters via setFilters', () => {
    const { result } = renderHook(() => useFilters({ title: '' }))
    act(() => { result.current.setFilters({ title: 'batman' }) })
    expect(result.current.filters).toEqual({ title: 'batman' })
  })

  it('replaces the entire filters object', () => {
    const { result } = renderHook(() => useFilters({ title: 'old', rating: 5 }))
    act(() => { result.current.setFilters({ title: 'new', rating: 8 }) })
    expect(result.current.filters).toEqual({ title: 'new', rating: 8 })
  })

  it('preserves initial reference identity when not updated', () => {
    const initial = { title: '' }
    const { result } = renderHook(() => useFilters(initial))
    expect(result.current.filters).toBe(initial)
  })

  it('exposes a setFilters function', () => {
    const { result } = renderHook(() => useFilters({}))
    expect(typeof result.current.setFilters).toBe('function')
  })
})
