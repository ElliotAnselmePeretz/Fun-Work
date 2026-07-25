import type { GameIconName } from '../components/GameIcon'
import type { Id } from '../types'

export type GearType = 'weapon' | 'magic' | 'armour'

export interface ShopItem {
  id: Id
  name: string
  icon: GameIconName
  gearType: GearType
  image: string
  description: string
  role: string
  cost: number
  damage?: number
  critEvery?: number
  healing?: number
  defense?: number
  maxHpBonus?: number
  starter?: boolean
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  /**
   * Sprite art, which needs nearest-neighbour scaling to stay crisp. Every
   * piece currently sets this — the whole armory is drawn from one tileset so
   * it reads as a matched collection — but it stays per item so a future
   * painted piece cannot be silently rendered blocky.
   */
  pixelArt?: boolean
}

/**
 * Gear is deliberately arranged in price order within each class, and the art
 * is ordered with it: starter pieces are plain sticks and hide, endgame pieces
 * are gilded and ornate, so the tier is legible before reading a single stat.
 *
 * Existing ids and their damage values are retained so earlier purchases and
 * boss logs continue to replay exactly as before. A few display names changed
 * to match new art; ids never do.
 */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'lucky-pouch',
    name: 'Training Blade',
    icon: 'sword',
    gearType: 'weapon',
    image: '/assets/gear/weapons/training-blade.png',
    description: 'A short practice sword with a plain edge and modest reach.',
    role: 'Starter blade',
    cost: 0,
    damage: 8,
    critEvery: 5,
    starter: true,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'oak-club',
    name: 'Oak Club',
    icon: 'hammer',
    gearType: 'weapon',
    image: '/assets/gear/weapons/oak-club.png',
    description: 'A stripped branch with a weighted end. Cheap, clumsy, effective.',
    role: 'First upgrade',
    cost: 30,
    damage: 11,
    critEvery: 6,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'hunter-bow',
    name: 'Hand Crossbow',
    icon: 'target',
    gearType: 'weapon',
    image: '/assets/gear/weapons/hunter-bow.png',
    description: 'A small braced crossbow that lands critical bolts more often.',
    role: 'Frequent criticals',
    cost: 70,
    damage: 13,
    critEvery: 4,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'forest-fox',
    name: 'Iron Edge',
    icon: 'sword',
    gearType: 'weapon',
    image: '/assets/gear/weapons/iron-edge.png',
    description: 'A proper steel sword for early hunts and reliable damage.',
    role: 'Reliable blade',
    cost: 120,
    damage: 20,
    critEvery: 5,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'twin-fang',
    name: 'Twin Fang',
    icon: 'swords',
    gearType: 'weapon',
    image: '/assets/gear/weapons/twin-fang.png',
    description: 'A paired blade with a gilded crossguard and a quick second bite.',
    role: 'Duelist blade',
    cost: 170,
    damage: 27,
    critEvery: 4,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'star-trail',
    name: 'Arc Saber',
    icon: 'zap',
    gearType: 'weapon',
    image: '/assets/gear/weapons/arc-saber.png',
    description: 'A charged saber that cuts through tougher arena targets.',
    role: 'Fast striker',
    cost: 220,
    damage: 36,
    critEvery: 4,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'dwarven-axe',
    name: 'Dwarven Axe',
    icon: 'axe',
    gearType: 'weapon',
    image: '/assets/gear/weapons/dwarven-axe.png',
    description: 'A compact war axe with dependable mid-tier stopping power.',
    role: 'Heavy edge',
    cost: 280,
    damage: 44,
    critEvery: 5,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'golden-frame',
    name: 'Storm Hammer',
    icon: 'hammer',
    gearType: 'weapon',
    image: '/assets/gear/weapons/storm-hammer.png',
    description: 'A massive enchanted hammer built to end encounters quickly.',
    role: 'Boss breaker',
    cost: 350,
    damage: 58,
    critEvery: 4,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'siege-crossbow',
    name: 'Siege Crossbow',
    icon: 'target',
    gearType: 'weapon',
    image: '/assets/gear/weapons/siege-crossbow.png',
    description: 'A braced arbalest that punches a critical bolt through plate.',
    role: 'Precision ranged',
    cost: 430,
    damage: 68,
    critEvery: 3,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'flamebrand',
    name: 'Flamebrand',
    icon: 'flame',
    gearType: 'weapon',
    image: '/assets/gear/weapons/flamebrand.png',
    description: 'A burning greatsword that trades subtlety for raw pressure.',
    role: 'High pressure',
    cost: 480,
    damage: 75,
    critEvery: 4,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'quest-dragon',
    name: 'Sunforged Blade',
    icon: 'sparkles',
    gearType: 'weapon',
    image: '/assets/gear/weapons/sunforged-blade.png',
    description: 'A radiant greatsword for the toughest arena encounters.',
    role: 'Elite finisher',
    cost: 600,
    damage: 95,
    critEvery: 3,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'earthsplitter',
    name: 'Earthsplitter',
    icon: 'axe',
    gearType: 'weapon',
    image: '/assets/gear/weapons/earthsplitter.png',
    description: 'A twin-headed greataxe that lands somewhere between a hit and an earthquake.',
    role: 'Late-game axe',
    cost: 800,
    damage: 120,
    critEvery: 3,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'habit-royalty',
    name: 'Voidbreaker',
    icon: 'axe',
    gearType: 'weapon',
    image: '/assets/gear/weapons/voidbreaker.png',
    description: 'The strongest pure-damage weapon in the current armory.',
    role: 'Maximum damage',
    cost: 1000,
    damage: 150,
    critEvery: 3,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'apprentice-wand',
    name: 'Apprentice Wand',
    icon: 'sparkles',
    gearType: 'magic',
    image: '/assets/gear/magic/apprentice-wand.png',
    description: 'A stubby hooked wand. Barely a weapon, but it closes small wounds.',
    role: 'First healing',
    cost: 60,
    damage: 7,
    healing: 6,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'druid-branch',
    name: 'Druid Branch',
    icon: 'sparkles',
    gearType: 'magic',
    image: '/assets/gear/magic/druid-branch.png',
    description: 'Low damage, but its living wood restores health after a survived hit.',
    role: 'Starter sustain',
    cost: 160,
    damage: 10,
    healing: 10,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'crystal-staff',
    name: 'Crystal Staff',
    icon: 'zap',
    gearType: 'magic',
    image: '/assets/gear/magic/crystal-staff.png',
    description: 'A balanced channeling staff for steady damage and recovery.',
    role: 'Balanced sustain',
    cost: 340,
    damage: 26,
    healing: 16,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'tidecaller-staff',
    name: 'Tidecaller Staff',
    icon: 'zap',
    gearType: 'magic',
    image: '/assets/gear/magic/tidecaller-staff.png',
    description: 'Frost magic that chills the arena and knits wounds between blows.',
    role: 'Sustained pressure',
    cost: 470,
    damage: 40,
    healing: 22,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'sanctum-scepter',
    name: 'Sanctum Scepter',
    icon: 'crown',
    gearType: 'magic',
    image: '/assets/gear/magic/sanctum-scepter.png',
    description: 'Holy magic that keeps long boss attempts from collapsing.',
    role: 'Greater healing',
    cost: 700,
    damage: 55,
    healing: 30,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'phoenix-signet',
    name: 'Phoenix Staff',
    icon: 'flame',
    gearType: 'magic',
    image: '/assets/gear/magic/phoenix-staff.png',
    description: 'A gold-crowned staff that answers every survived blow with new life.',
    role: 'Elite sustain',
    cost: 900,
    damage: 72,
    healing: 40,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'codex-renewal',
    name: 'Codex of Renewal',
    icon: 'sparkles',
    gearType: 'magic',
    image: '/assets/gear/magic/codex-of-renewal.png',
    description: 'Endgame restoration with less force than Voidbreaker but immense sustain.',
    role: 'Maximum sustain',
    cost: 1150,
    damage: 95,
    healing: 50,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'traveler-guard',
    name: 'Traveler Hide',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour/traveler-guard.png',
    description: 'A roll of stitched hide. It is what every challenger starts in.',
    role: 'Starter protection',
    cost: 0,
    defense: 2,
    maxHpBonus: 15,
    starter: true,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'oak-buckler',
    name: 'Oak Buckler',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour/oak-buckler.png',
    description: 'Banded oak on a leather strap. It will not last, but it helps today.',
    role: 'First shield',
    cost: 35,
    defense: 3,
    maxHpBonus: 20,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'hide-vest',
    name: 'Hide Vest',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour/hide-vest.png',
    description: 'Flexible leather with a small but useful health reserve.',
    role: 'Light armour',
    cost: 70,
    defense: 4,
    maxHpBonus: 25,
    pixelArt: true,
    rarity: 'Common',
  },
  {
    id: 'field-plate',
    name: 'Field Mail',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour/field-plate.png',
    description: 'Linked steel that makes early boss strikes manageable.',
    role: 'Early defence',
    cost: 90,
    defense: 5,
    maxHpBonus: 35,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'ranger-scale',
    name: 'Ranger Scale',
    icon: 'shield',
    gearType: 'armour',
    image: '/assets/gear/armour/ranger-scale.png',
    description: 'Light silvered scale that trades bulk for a deeper health pool.',
    role: 'Mid-tier scale',
    cost: 180,
    defense: 7,
    maxHpBonus: 50,
    pixelArt: true,
    rarity: 'Rare',
  },
  {
    id: 'warden-mail',
    name: 'Warden Plate',
    icon: 'castle',
    gearType: 'armour',
    image: '/assets/gear/armour/warden-mail.png',
    description: 'Full plate tuned for longer encounters and heavy blows.',
    role: 'Heavy armour',
    cost: 300,
    defense: 10,
    maxHpBonus: 65,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'dragon-plate',
    name: 'Dragon Plate',
    icon: 'flame',
    gearType: 'armour',
    image: '/assets/gear/armour/dragon-plate.png',
    description: 'Golden scale plate that bridges the late-game difficulty jump.',
    role: 'Elite defence',
    cost: 520,
    defense: 16,
    maxHpBonus: 90,
    pixelArt: true,
    rarity: 'Epic',
  },
  {
    id: 'void-plate',
    name: 'Void Plate',
    icon: 'crown',
    gearType: 'armour',
    image: '/assets/gear/armour/void-plate.png',
    description: 'Legendary armour made to survive the final arena.',
    role: 'Maximum defence',
    cost: 750,
    defense: 22,
    maxHpBonus: 120,
    pixelArt: true,
    rarity: 'Legendary',
  },
  {
    id: 'aegis-bulwark',
    name: 'Aegis Plate',
    icon: 'castle',
    gearType: 'armour',
    image: '/assets/gear/armour/aegis-plate.png',
    description: 'Gilded dragon plate. Nothing in the arena hits harder than it holds.',
    role: 'Endgame guard',
    cost: 950,
    defense: 27,
    maxHpBonus: 150,
    pixelArt: true,
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
    (item) => item.gearType !== 'armour' && isItemOwned(item, ownedItemIds),
  )
}

export function ownedArmour(ownedItemIds: Set<string>): ShopItem[] {
  return SHOP_ITEMS.filter(
    (item) => item.gearType === 'armour' && isItemOwned(item, ownedItemIds),
  )
}

export function getWeapon(itemId: Id): ShopItem | undefined {
  const item = getShopItem(itemId)
  return item?.gearType !== 'armour' ? item : undefined
}

export function getArmour(itemId: Id | undefined): ShopItem | undefined {
  if (!itemId) return undefined
  const item = getShopItem(itemId)
  return item?.gearType === 'armour' ? item : undefined
}
