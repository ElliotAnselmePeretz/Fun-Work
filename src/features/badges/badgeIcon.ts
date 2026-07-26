import type { PixelIconName } from '../../components/PixelIcon'
import type { BadgeKind } from '../../types'

/**
 * The sprite that stands for each badge.
 *
 * Derived from the badge's kind rather than stored, so the emoji still sitting
 * on older badge rows never has to be migrated — and the artwork can change
 * without rewriting anybody's history.
 */
const ICONS: Record<BadgeKind, PixelIconName> = {
  'first-log': 'flame',
  'level-up': 'crystal',
  streak: 'flame',
  'activity-complete': 'chest',
  'coin-total': 'coin',
  'xp-total': 'coin',
}

export function badgeIcon(kind?: BadgeKind): PixelIconName {
  return (kind && ICONS[kind]) || 'crystal'
}
