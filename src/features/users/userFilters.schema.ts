import type { FiltersSchema } from '@/types/table'

export type UserFilters = {
  username: string
  role: 'admin' | 'guest' | ''
  created_after: string
  created_by: string
}

export const INITIAL_USER_FILTERS: UserFilters = {
  username: '',
  role: '',
  created_after: '',
  created_by: '',
}

export const staticUserFiltersSchema: FiltersSchema<UserFilters> = [
  {
    key: 'username',
    label: 'users.filters.username',
    type: 'text',
  },
  {
    key: 'role',
    label: 'users.filters.role',
    type: 'select',
    options: [
      { value: 'admin', label: 'users.roles.admin' },
      { value: 'guest', label: 'users.roles.guest' },
    ],
  },
  {
    key: 'created_after',
    label: 'users.filters.createdAfter',
    type: 'date',
  },
  {
    key: 'created_by',
    label: 'users.filters.createdBy',
    type: 'select',
    options: [], // populated dynamically in the feature
  },
]
