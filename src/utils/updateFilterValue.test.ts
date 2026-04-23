import { updateFilterValue } from './updateFilterValue'

type Filters = { title: string; year: number; active: boolean }

const base: Filters = { title: 'inception', year: 2010, active: true }

describe('updateFilterValue', () => {
  it('updates the target key', () => {
    const result = updateFilterValue(base, 'title', 'avatar')
    expect(result.title).toBe('avatar')
  })

  it('leaves other keys unchanged', () => {
    const result = updateFilterValue(base, 'title', 'avatar')
    expect(result.year).toBe(2010)
    expect(result.active).toBe(true)
  })

  it('returns a new object (immutability)', () => {
    const result = updateFilterValue(base, 'year', 2020)
    expect(result).not.toBe(base)
  })

  it('updates a number key', () => {
    expect(updateFilterValue(base, 'year', 1999).year).toBe(1999)
  })

  it('updates a boolean key', () => {
    expect(updateFilterValue(base, 'active', false).active).toBe(false)
  })
})
