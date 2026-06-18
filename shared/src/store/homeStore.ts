import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ssrStorage } from './storage'

export type CardId = 'top10' | 'calendar' | 'stats' | 'genres'

export const DEFAULT_CARD_ORDER: CardId[] = ['top10', 'calendar', 'stats', 'genres']

type HomeState = {
  cardOrders: Record<string, CardId[]>
  setCardOrder: (userId: string, order: CardId[]) => void
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set) => ({
      cardOrders: {},
      setCardOrder: (userId, order) =>
        set((s) => ({ cardOrders: { ...s.cardOrders, [userId]: order } })),
    }),
    { name: 'popcorn-home-v1', storage: ssrStorage },
  ),
)
