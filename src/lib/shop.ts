import type { GameIconName } from '../components/GameIcon'
import type { Id } from '../types'

export interface ShopItem {
  id: Id
  name: string
  icon: GameIconName
  description: string
  cost: number
  damage: number
  starter?: boolean
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
}

/**
 * A functional armory. Existing item ids are deliberately retained so anyone
 * who bought an earlier cosmetic keeps ownership after upgrading to weapons.
 */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'lucky-pouch',
    name: 'Training Blade',
    icon: 'sword',
    description: 'Balanced and dependable. Included for every new adventurer.',
    cost: 0,
    damage: 8,
    starter: true,
    rarity: 'Common',
  },
  {
    id: 'forest-fox',
    name: 'Iron Edge',
    icon: 'sword',
    description: 'Forged for early hunts with a stronger, cleaner strike.',
    cost: 120,
    damage: 20,
    rarity: 'Rare',
  },
  {
    id: 'star-trail',
    name: 'Arc Saber',
    icon: 'zap',
    description: 'A charged blade that cuts through armored targets.',
    cost: 220,
    damage: 36,
    rarity: 'Rare',
  },
  {
    id: 'golden-frame',
    name: 'Titan Hammer',
    icon: 'hammer',
    description: 'Slow, heavy, and built to crack a boss guard in one swing.',
    cost: 350,
    damage: 58,
    rarity: 'Epic',
  },
  {
    id: 'quest-dragon',
    name: 'Sunforged Blade',
    icon: 'sparkles',
    description: 'A radiant greatsword for the toughest arena encounters.',
    cost: 600,
    damage: 95,
    rarity: 'Legendary',
  },
  {
    id: 'habit-royalty',
    name: 'Voidbreaker',
    icon: 'axe',
    description: 'Endgame gear with enough force to finish legendary bosses.',
    cost: 1000,
    damage: 150,
    rarity: 'Legendary',
  },
]

export function getShopItem(itemId: Id): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId)
}

export function isItemOwned(item: ShopItem, ownedItemIds: Set<string>): boolean {
  return item.starter === true || ownedItemIds.has(item.id)
}

export function ownedWeapons(ownedItemIds: Set<string>): ShopItem[] {
  return SHOP_ITEMS.filter((item) => isItemOwned(item, ownedItemIds))
}
