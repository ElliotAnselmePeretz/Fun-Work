import {
  computeBossProgress,
  type BossMoveKind,
  type PlayerAction,
  type StrikeTiming,
} from '../../lib/bosses'
import { isPurchaseLog } from '../../lib/coins'
import { dayKey } from '../../lib/date'
import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { getArmour, getWeapon, isItemOwned } from '../../lib/shop'
import type { BossHitLogEntry, Id } from '../../types'

export interface AttackResult {
  playerDamage: number
  bossDamage: number
  healing: number
  critical: boolean
  lost: boolean
  defeated: boolean
  coinReward: number
  /** What the boss did on this turn, and what the player answered with. */
  move?: BossMoveKind
  action: PlayerAction
  timing?: StrikeTiming
  bossHealed: number
}

export interface TurnInput {
  bossId: Id
  weaponId: Id
  armourId: Id
  action: PlayerAction
  /** Ignored when guarding. */
  timing?: StrikeTiming
}

/**
 * Appends one combat turn to the ledger and reports how it resolved.
 *
 * The event stores only what the player chose; the outcome comes back out of
 * `computeBossProgress`, so what the screen shows is exactly what a later
 * replay will derive.
 */
export async function takeTurn(input: TurnInput): Promise<AttackResult> {
  const { bossId, weaponId, armourId, action } = input
  return db.transaction('rw', db.logs, async () => {
    const ledger = await db.logs.toArray()
    const progress = computeBossProgress(ledger).find(
      (candidate) => candidate.boss.id === bossId,
    )
    if (!progress) throw new Error('That boss is no longer in the arena.')
    if (progress.locked) throw new Error('Defeat the previous boss first.')
    if (progress.defeated) throw new Error('This boss is already defeated.')

    const weapon = getWeapon(weaponId)
    if (!weapon) throw new Error('Choose a weapon before attacking.')
    const armour = getArmour(armourId)
    if (!armour) throw new Error('Choose armour before attacking.')
    const purchased = new Set(
      ledger.filter(isPurchaseLog).map((entry) => entry.itemId),
    )
    if (!isItemOwned(weapon, purchased)) {
      throw new Error('Buy this weapon in the Armory first.')
    }
    if (!isItemOwned(armour, purchased)) {
      throw new Error('Buy this armour in the Armory first.')
    }
    if (
      progress.attemptHits > 0 &&
      progress.armourId !== undefined &&
      progress.armourId !== armour.id
    ) {
      throw new Error('Your armour is locked until this attempt ends.')
    }

    const now = Date.now()
    const hit: BossHitLogEntry = {
      id: newId(),
      kind: 'boss-hit',
      bossId,
      weaponId,
      armourId,
      action,
      ...(action === 'strike' && input.timing ? { timing: input.timing } : undefined),
      at: now,
      day: dayKey(now),
    }
    await db.logs.add(hit)

    const after = computeBossProgress([...ledger, hit]).find(
      (candidate) => candidate.boss.id === bossId,
    )
    const turn = after?.lastTurn
    return {
      playerDamage: turn?.playerDamage ?? 0,
      bossDamage: turn?.bossDamage ?? 0,
      healing: turn?.healing ?? 0,
      critical: turn?.critical ?? false,
      lost: turn?.lost ?? false,
      defeated: after?.defeated ?? false,
      coinReward: after?.defeated ? progress.boss.coinReward : 0,
      move: turn?.move,
      action,
      timing: turn?.timing,
      bossHealed: turn?.bossHealed ?? 0,
    }
  })
}
