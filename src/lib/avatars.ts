import { assetUrl } from './asset'
/**
 * Art avatars for categories and activities, replacing the old emoji.
 *
 * By default the choice is *derived* from the name and id, so no existing row
 * needs migrating and a rename picks a better icon straight away. Names are
 * matched against a keyword table first; anything unmatched falls back to a
 * stable hash so two activities rarely collide and one activity never changes
 * icon on its own.
 *
 * A row may also pin an icon explicitly, which is what the picker writes. That
 * lives in the existing `emoji` field as an `avatar:` token rather than a new
 * column, so the schema is untouched and old rows — which hold a real emoji
 * character, or nothing — keep working exactly as before.
 */

export const AVATARS = [
  'amulet',
  'apple',
  'axe',
  'banana',
  'blade',
  'book',
  'boots',
  'bow',
  'box',
  'bread',
  'cheese',
  'cloak',
  'club',
  'coin',
  'dagger',
  'flask',
  'food',
  'gold',
  'grape',
  'hat',
  'heart',
  'helm',
  'helmet',
  'honey',
  'horn',
  'key',
  'lantern',
  'lemon',
  'mace',
  'map',
  'meat',
  'mirror',
  'orange',
  'orb',
  'pear',
  'pizza',
  'potion',
  'ring',
  'rune',
  'scroll',
  'shield',
  'spear',
  'staff',
  'trident',
  'wand',
  'wand2',
  'whip',
] as const

export type AvatarName = (typeof AVATARS)[number]

/** First match wins, so put the more specific patterns higher. */
const KEYWORDS: [RegExp, AvatarName][] = [
  [/run|jog|walk|hike|cardio|step|march/, 'boots'],
  [/swim|water|hydrat|drink/, 'flask'],
  [/gym|lift|weight|push|pull|squat|strength|workout|exercis|train/, 'axe'],
  [/read|book|novel|revis|study|homework|essay/, 'book'],
  [/math|physic|chem|bio|scien|calc|stats/, 'scroll'],
  [/writ|journal|blog|note|diary/, 'scroll'],
  [/eat|meal|cook|food|diet|nutrit|fruit|veg/, 'apple'],
  [/medit|sleep|rest|calm|breath|mindful|yoga/, 'amulet'],
  [/music|guitar|piano|violin|sing|instrument|rehears/, 'staff'],
  [/code|program|dev|engineer|ship|build/, 'wand'],
  [/money|save|budget|finance|invest/, 'gold'],
  [/clean|tidy|chore|laundry|dish|house/, 'helm'],
  [/language|spanish|french|german|japanese|vocab|word/, 'ring'],
  [/art|draw|paint|design|sketch|photo/, 'potion'],
  [/defen|guard|protect|shield|floss|brush|skin/, 'shield'],
  [/fight|spar|martial|box|climb|compet/, 'blade'],
  [/aim|target|focus|goal|habit|practice/, 'bow'],
  [/cook|bake|kitchen|recipe/, 'bread'],
  [/fruit|snack|apple|orange|banana/, 'orange'],
  [/coffee|tea|brew/, 'flask'],
  [/sleep|bed|night|wake|morning/, 'lantern'],
  [/plan|organis|organiz|admin|inbox|email|tidy/, 'box'],
  [/spend|bill|pay|budget|cost/, 'coin'],
  [/travel|explore|route|map|navigat/, 'map'],
  [/sing|voice|speak|present|podcast/, 'horn'],
  [/dress|outfit|wardrobe|laundry/, 'cloak'],
  [/hat|study|revise|exam|lecture|class/, 'hat'],
  [/heart|health|therapy|mood|journal/, 'heart'],
  [/swim|surf|dive|row|sail/, 'trident'],
  [/climb|hike|mountain|trek/, 'spear'],
  [/lift|press|deadlift|squat|heavy/, 'mace'],
  [/secret|password|admin|account|login/, 'key'],
]

/** Stable 32-bit hash (FNV-1a) so a given id always lands on the same icon. */
function hash(value: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const AVATAR_PREFIX = 'avatar:'

/** What the picker stores for an explicitly chosen icon. */
export function avatarToken(avatar: AvatarName): string {
  return `${AVATAR_PREFIX}${avatar}`
}

/**
 * Reads a pinned icon out of a stored `emoji` value, or undefined when there
 * isn't one — an empty field, or a legacy emoji character.
 */
export function avatarFromToken(stored?: string): AvatarName | undefined {
  if (!stored?.startsWith(AVATAR_PREFIX)) return undefined
  const name = stored.slice(AVATAR_PREFIX.length) as AvatarName
  return AVATARS.includes(name) ? name : undefined
}

/** An explicit choice wins; otherwise the name and id decide. */
export function avatarFor(name: string, id: string, stored?: string): AvatarName {
  const pinned = avatarFromToken(stored)
  if (pinned) return pinned

  const haystack = name.toLowerCase()
  for (const [pattern, avatar] of KEYWORDS) {
    if (pattern.test(haystack)) return avatar
  }
  return AVATARS[hash(id || name) % AVATARS.length]
}

export function avatarSrc(avatar: AvatarName): string {
  return assetUrl(`/assets/avatars/${avatar}.png`)
}

/** Convenience for the common "I have a record, give me its art" case. */
export function avatarSrcFor(name: string, id: string, stored?: string): string {
  return avatarSrc(avatarFor(name, id, stored))
}
