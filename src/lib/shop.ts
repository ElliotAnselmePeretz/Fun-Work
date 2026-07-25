import type { GameIconName } from '../components/GameIcon'
import type { Id } from '../types'

export interface ShopItem {
  id: Id
  name: string
  icon: GameIconName
  gearType: 'weapon' | 'armour'
  image: string
  description: string
  cost: number
  damage?: number
  critEvery?: number
  defense?: number
  maxHpBonus?: number
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
    gearType: 'weapon',
    image: '/assets/gear/training-blade.png',
    description: 'Balanced and dependable. Included for every new adventurer.',
    cost: 0,
    damage: 8,
    critEvery: 5,
    starter: true,
    rarity: 'Common',
  },
  {
    id: 'forest-fox',
    name: 'Iron Edge',
    icon: 'sword',
    gearType: 'weapon',
    image: '/assets/gear/iron-edge.png',
    description: 'Forged for early hunts with a stronger, cleaner strike.',
    cost: 120,
    damage: 20,
    critEvery: 5,
    rarity: 'Rare',
  },
  {
    id: 'star-trail',
    name: 'Arc Saber',
    icon: 'zap',
    gearType: 'weapon',
    image: '/assets/gear/arc-saber.png',
    description: 'A charged blade that cuts through armored targets.',
    cost: 220,
    damage: 36,
    critEvery: 4,
    rarity: 'Rare',
  },
  {
    id: 'golden-frame',
    name: 'Storm Cleaver',
    icon: 'sword',
    gearType: 'weapon',
    image: '/assets/gear/storm-cleaver.png',
    description: 'A heavy storm blade built to crack a boss guard in one swing.',
    cost: 350,
    damage: 58,
    critEvery: 4,
    rarity: 'Epic',
  },
  {
    id: 'quest-dragon',
    name: 'Sunforged Blade',
    icon: 'sparkles',
    gearType: 'weapon',
    image: '/assets/gear/sunforged-blade.png',
    description: 'A radiant greatsword for the toughest arena encounters.',
    cost: 600,
    damage: 95,
    critEvery: 3,
    rarity: 'Legendary',
  },
  {
    id: 'habit-royalty',
    name: 'Voidbreaker',
    icon: 'axe',
    gearType: 'weapon',
    image: '/assets/gear/voidbreaker.png',
    description: 'Endgame gear with enough force to finish legendary bosses.',
    cost: 1000,
    damage: 150,
    critEvery: 3,
    rarity: 'Legendary',
  },
  {
    id: 'traveler-guard',
    name: 'Traveler Guard',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour-set.png',
    description: 'Light protection issued to every new arena challenger.',
    cost: 0,
    defense: 2,
    maxHpBonus: 15,
    starter: true,
    rarity: 'Common',
  },
  {
    id: 'field-plate',
    name: 'Field Plate',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour-set.png',
    description: 'Layered steel that keeps early boss strikes manageable.',
    cost: 90,
    defense: 5,
    maxHpBonus: 35,
    rarity: 'Rare',
  },
  {
    id: 'warden-mail',
    name: 'Warden Mail',
    icon: 'castle',
    gearType: 'armour',
    image: '/assets/gear/armour-set.png',
    description: 'Charged plate tuned for longer encounters and heavy blows.',
    cost: 300,
    defense: 10,
    maxHpBonus: 65,
    rarity: 'Epic',
  },
  {
    id: 'void-plate',
    name: 'Void Plate',
    icon: 'crown',
    gearType: 'armour',
    image: '/assets/gear/armour-set.png',
    description: 'Legendary armour made to survive the final arena.',
    cost: 750,
    defense: 22,
    maxHpBonus: 120,
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
  return SHOP_ITEMS.filter(
    (item) => item.gearType === 'weapon' && isItemOwned(item, ownedItemIds),
  )
}

export function ownedArmour(ownedItemIds: Set<string>): ShopItem[] {
  return SHOP_ITEMS.filter(
    (item) => item.gearType === 'armour' && isItemOwned(item, ownedItemIds),
  )
}

export function getWeapon(itemId: Id): ShopItem | undefined {
  const item = getShopItem(itemId)
  return item?.gearType === 'weapon' ? item : undefined
}

export function getArmour(itemId: Id | undefined): ShopItem | undefined {
  if (!itemId) return undefined
  const item = getShopItem(itemId)
  return item?.gearType === 'armour' ? item : undefined
}
