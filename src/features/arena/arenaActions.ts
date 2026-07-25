import { computeBossProgress } from '../../lib/bosses'
import { isPurchaseLog } from '../../lib/coins'
import { dayKey } from '../../lib/date'
import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { getShopItem, isItemOwned } from '../../lib/shop'
import type { BossHitLogEntry, Id } from '../../types'

export interface AttackResult {
  damage: number
  defeated: boolean
  coinReward: number
}

export async function attackBoss(
  bossId: Id,
  weaponId: Id,
): Promise<AttackResult> {
  return db.transaction('rw', db.logs, async () => {
    const ledger = await db.logs.toArray()
    const progress = computeBossProgress(ledger).find(
      (candidate) => candidate.boss.id === bossId,
    )
    if (!progress) throw new Error('That boss is no longer in the arena.')
    if (progress.locked) throw new Error('Defeat the previous boss first.')
    if (progress.defeated) throw new Error('This boss is already defeated.')

    const weapon = getShopItem(weaponId)
    if (!weapon) throw new Error('Choose a weapon before attacking.')
    const purchased = new Set(
      ledger.filter(isPurchaseLog).map((entry) => entry.itemId),
    )
    if (!isItemOwned(weapon, purchased)) {
      throw new Error('Buy this weapon in the Armory first.')
    }

    const now = Date.now()
    const hit: BossHitLogEntry = {
      id: newId(),
      kind: 'boss-hit',
      bossId,
      weaponId,
      at: now,
      day: dayKey(now),
    }
    await db.logs.add(hit)

    const after = computeBossProgress([...ledger, hit]).find(
      (candidate) => candidate.boss.id === bossId,
    )
    return {
      damage: weapon.damage,
      defeated: after?.defeated ?? false,
      coinReward: after?.defeated ? progress.boss.coinReward : 0,
    }
  })
}
