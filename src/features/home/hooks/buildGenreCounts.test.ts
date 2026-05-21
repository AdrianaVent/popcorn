import { buildGenreCounts } from './buildGenreCounts'

describe('buildGenreCounts', () => {
  it('returns empty array when given no entries', () => {
    expect(buildGenreCounts([])).toEqual([])
  })

  it('returns empty array when all genre arrays are empty', () => {
    expect(buildGenreCounts([[], []])).toEqual([])
  })

  it('counts a single genre across multiple entries', () => {
    const result = buildGenreCounts([
      [{ name: 'Action' }],
      [{ name: 'Action' }],
      [{ name: 'Action' }],
    ])
    expect(result).toEqual([{ name: 'Action', count: 3 }])
  })

  it('counts multiple genres correctly', () => {
    const result = buildGenreCounts([
      [{ name: 'Action' }, { name: 'Drama' }],
      [{ name: 'Drama' }],
      [{ name: 'Comedy' }],
    ])
    expect(result).toContainEqual({ name: 'Action', count: 1 })
    expect(result).toContainEqual({ name: 'Drama', count: 2 })
    expect(result).toContainEqual({ name: 'Comedy', count: 1 })
  })

  it('sorts results by count descending', () => {
    const result = buildGenreCounts([
      [{ name: 'Action' }],
      [{ name: 'Action' }, { name: 'Drama' }],
      [{ name: 'Action' }, { name: 'Drama' }],
      [{ name: 'Comedy' }],
    ])
    expect(result[0].name).toBe('Action')
    expect(result[1].name).toBe('Drama')
    expect(result[2].name).toBe('Comedy')
  })

  it('deduplicates genre names within a single entry', () => {
    const result = buildGenreCounts([
      [{ name: 'Action' }, { name: 'Action' }],
      [{ name: 'Action' }],
    ])
    expect(result).toEqual([{ name: 'Action', count: 2 }])
  })

  it('slices to at most 10 entries', () => {
    const entries = Array.from({ length: 15 }, (_, i) => [{ name: `Genre${i}` }])
    const result = buildGenreCounts(entries)
    expect(result).toHaveLength(10)
  })

  it('handles entries with mixed genre arrays (some empty, some populated)', () => {
    const result = buildGenreCounts([
      [],
      [{ name: 'Thriller' }],
      [],
      [{ name: 'Thriller' }, { name: 'Horror' }],
    ])
    expect(result).toContainEqual({ name: 'Thriller', count: 2 })
    expect(result).toContainEqual({ name: 'Horror', count: 1 })
  })

  it('treats genre names as case-sensitive', () => {
    const result = buildGenreCounts([
      [{ name: 'action' }],
      [{ name: 'Action' }],
    ])
    expect(result).toHaveLength(2)
    expect(result.find((e) => e.name === 'action')?.count).toBe(1)
    expect(result.find((e) => e.name === 'Action')?.count).toBe(1)
  })

  it('top-10 keeps the highest-count genres when there are more than 10', () => {
    // 15 genres each appearing a distinct number of times (15 down to 1)
    // Top 10 are Genre15…Genre6; Genre5…Genre1 should be excluded
    const entries = Array.from({ length: 15 }, (_, i) =>
      Array.from({ length: 15 - i }, () => [{ name: `Genre${15 - i}` }])
    ).flat()
    const result = buildGenreCounts(entries)
    expect(result).toHaveLength(10)
    expect(result[0]).toEqual({ name: 'Genre15', count: 15 })
    expect(result.find((e) => e.name === 'Genre1')).toBeUndefined()
    expect(result.find((e) => e.name === 'Genre5')).toBeUndefined()
  })
})
