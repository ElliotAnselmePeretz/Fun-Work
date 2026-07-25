/**
 * Art avatars for categories and activities, replacing the old emoji.
 *
 * The choice is *derived* from the name and id, never stored, so no existing
 * row needs migrating and a rename picks a better icon straight away. Names
 * are matched against a keyword table first; anything unmatched falls back to
 * a stable hash so two activities rarely collide and one activity never
 * changes icon on its own.
 */

export const AVATARS = [
  'amulet',
  'apple',
  'axe',
  'blade',
  'book',
  'boots',
  'bow',
  'flask',
  'food',
  'gold',
  'helm',
  'potion',
  'ring',
  'scroll',
  'shield',
  'staff',
  'wand',
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

export function avatarFor(name: string, id: string): AvatarName {
  const haystack = name.toLowerCase()
  for (const [pattern, avatar] of KEYWORDS) {
    if (pattern.test(haystack)) return avatar
  }
  return AVATARS[hash(id || name) % AVATARS.length]
}

export function avatarSrc(avatar: AvatarName): string {
  return `/assets/avatars/${avatar}.png`
}

/** Convenience for the common "I have a record, give me its art" case. */
export function avatarSrcFor(name: string, id: string): string {
  return avatarSrc(avatarFor(name, id))
}
