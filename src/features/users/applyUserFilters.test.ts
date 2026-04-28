import { applyUserFilters } from './applyUserFilters'
import type { PublicUser } from '@/types/user'

const user = (overrides: Partial<PublicUser> = {}): PublicUser => ({
  id: 'u1',
  username: 'alice',
  role: 'guest',
  created_at: new Date('2024-06-15T10:00:00Z').getTime(),
  created_by: null,
  ...overrides,
})

const users: PublicUser[] = [
  user({ id: 'u1', username: 'alice', role: 'guest',  created_at: new Date('2024-06-15T10:00:00Z').getTime(), created_by: null }),
  user({ id: 'u2', username: 'bob',   role: 'admin',  created_at: new Date('2024-07-01T08:00:00Z').getTime(), created_by: 'u1' }),
  user({ id: 'u3', username: 'carol', role: 'guest',  created_at: new Date('2024-07-20T12:00:00Z').getTime(), created_by: 'u1' }),
]

describe('applyUserFilters', () => {
  it('returns all users when filters are empty', () => {
    expect(applyUserFilters(users, {})).toHaveLength(3)
  })

  describe('username filter', () => {
    it('filters by partial username (case-insensitive)', () => {
      expect(applyUserFilters(users, { username: 'ali' })).toHaveLength(1)
      expect(applyUserFilters(users, { username: 'ALI' })).toHaveLength(1)
    })

    it('returns empty when no username matches', () => {
      expect(applyUserFilters(users, { username: 'xyz' })).toHaveLength(0)
    })
  })

  describe('role filter', () => {
    it('filters by role', () => {
      const result = applyUserFilters(users, { role: 'admin' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('u2')
    })

    it('returns all users when role is empty string', () => {
      expect(applyUserFilters(users, { role: '' })).toHaveLength(3)
    })
  })

  describe('created_after filter', () => {
    it('excludes users created before the given date', () => {
      const result = applyUserFilters(users, { created_after: '2024-07-01' })
      expect(result.map((u) => u.id)).toEqual(['u2', 'u3'])
    })

    it('includes users created on the given date', () => {
      const result = applyUserFilters(users, { created_after: '2024-07-20' })
      expect(result.map((u) => u.id)).toEqual(['u3'])
    })

    it('returns empty when all users predate the filter', () => {
      expect(applyUserFilters(users, { created_after: '2025-01-01' })).toHaveLength(0)
    })
  })

  describe('created_by filter', () => {
    it('filters by creator id', () => {
      const result = applyUserFilters(users, { created_by: 'u1' })
      expect(result.map((u) => u.id)).toEqual(['u2', 'u3'])
    })

    it('returns empty when no user matches the creator', () => {
      expect(applyUserFilters(users, { created_by: 'unknown' })).toHaveLength(0)
    })
  })

  describe('combined filters', () => {
    it('applies all active filters together', () => {
      const result = applyUserFilters(users, {
        role: 'guest',
        created_after: '2024-07-01',
      })
      expect(result.map((u) => u.id)).toEqual(['u3'])
    })
  })
})
