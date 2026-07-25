import type { Id } from '../types'

export type ShopItemKind = 'collectible' | 'companion' | 'effect' | 'title'

export interface ShopItem {
  id: Id
  name: string
  emoji: string
  description: string
  cost: number
  kind: ShopItemKind
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
}

/** Static catalog; ownership is derived from purchase entries in the log. */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'lucky-pouch',
    name: 'Lucky Pouch',
    emoji: '👝',
    description: 'A shiny first treasure for your quest shelf.',
    cost: 40,
    kind: 'collectible',
    rarity: 'Common',
  },
  {
    id: 'forest-fox',
    name: 'Forest Fox',
    emoji: '🦊',
    description: 'A clever companion who cheers from your quest banner.',
    cost: 120,
    kind: 'companion',
    rarity: 'Rare',
  },
  {
    id: 'star-trail',
    name: 'Star Trail',
    emoji: '✨',
    description: 'Adds a sparkling trail to your home quest banner.',
    cost: 220,
    kind: 'effect',
    rarity: 'Rare',
  },
  {
    id: 'golden-frame',
    name: 'Golden Frame',
    emoji: '🏆',
    description: 'Gives your quest banner a champion-grade golden edge.',
    cost: 350,
    kind: 'effect',
    rarity: 'Epic',
  },
  {
    id: 'quest-dragon',
    name: 'Quest Dragon',
    emoji: '🐉',
    description: 'A legendary companion for serious streak keepers.',
    cost: 600,
    kind: 'companion',
    rarity: 'Legendary',
  },
  {
    id: 'habit-royalty',
    name: 'Habit Royalty',
    emoji: '👑',
    description: 'Adds a crown to your Fun-Work title for good.',
    cost: 1000,
    kind: 'title',
    rarity: 'Legendary',
  },
]

export function getShopItem(itemId: Id): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId)
}

export function activeCompanion(owned: Set<string>): ShopItem | undefined {
  return (
    SHOP_ITEMS.find((item) => item.id === 'quest-dragon' && owned.has(item.id)) ??
    SHOP_ITEMS.find((item) => item.id === 'forest-fox' && owned.has(item.id))
  )
}
