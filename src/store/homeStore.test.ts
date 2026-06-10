import { useHomeStore, DEFAULT_CARD_ORDER } from './homeStore'

beforeEach(() => {
  useHomeStore.setState({ cardOrders: {} })
})

describe('homeStore', () => {
  it('starts with empty cardOrders', () => {
    expect(useHomeStore.getState().cardOrders).toEqual({})
  })

  it('falls back to DEFAULT_CARD_ORDER for unknown user', () => {
    const order = useHomeStore.getState().cardOrders['unknown'] ?? DEFAULT_CARD_ORDER
    expect(order).toEqual(DEFAULT_CARD_ORDER)
  })

  it('saves card order for a specific user', () => {
    const custom = ['stats', 'genres', 'top10', 'calendar'] as typeof DEFAULT_CARD_ORDER
    useHomeStore.getState().setCardOrder('user1', custom)
    expect(useHomeStore.getState().cardOrders['user1']).toEqual(custom)
  })

  it('does not affect other users when saving', () => {
    useHomeStore.getState().setCardOrder('user1', ['stats', 'genres', 'top10', 'calendar'])
    expect(useHomeStore.getState().cardOrders['user2']).toBeUndefined()
  })

  it('preserves existing users when updating another', () => {
    useHomeStore.getState().setCardOrder('user1', ['stats', 'genres', 'top10', 'calendar'])
    useHomeStore.getState().setCardOrder('user2', ['calendar', 'top10', 'genres', 'stats'])
    expect(useHomeStore.getState().cardOrders['user1']).toEqual(['stats', 'genres', 'top10', 'calendar'])
    expect(useHomeStore.getState().cardOrders['user2']).toEqual(['calendar', 'top10', 'genres', 'stats'])
  })

  it('overwrites existing order for the same user', () => {
    useHomeStore.getState().setCardOrder('user1', ['stats', 'genres', 'top10', 'calendar'])
    useHomeStore.getState().setCardOrder('user1', DEFAULT_CARD_ORDER)
    expect(useHomeStore.getState().cardOrders['user1']).toEqual(DEFAULT_CARD_ORDER)
  })
})
