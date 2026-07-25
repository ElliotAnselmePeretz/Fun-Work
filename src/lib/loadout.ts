import { computeBossProgress, type Boss } from './bosses'
import { dayKey } from './date'
import { ownedArmour, ownedWeapons, type ShopItem } from './shop'
import type { BossHitLogEntry, LogEntry } from '../types'

/**
 * How a loadout actually performs, measured by replaying it through the same
 * combat code the arena uses. Nothing here is stored — it is a what-if run over
 * synthetic hits, so the answer can never disagree with a real fight.
 */
export interface LoadoutOutcome {
  weapon: ShopItem
  armour: ShopItem
  /** Taps needed to win, or undefined if this loadout cannot win at all. */
  hitsToWin?: number
  /** True when the player's health runs out before the boss's does. */
  defeated: boolean
  /** Health left at the moment of victory. */
  survivingHp: number
  playerMaxHp: number
  damagePerTurn: number
  /** Boss damage that gets through this armour each retaliation. */
  incomingPerTurn: number
}

/** Hits are only ever simulated this far before a loadout is called hopeless. */
const MAX_SIMULATED_HITS = 400

/**
 * Replays a fresh attempt against `boss` using the real ledger rules.
 *
 * The synthetic hits carry an armourId, so they take the modern retaliation
 * path rather than the legacy no-retaliation one — this measures how a fight
 * would go today, not how an old log replays.
 */
export function simulateLoadout(
  boss: Boss,
  weapon: ShopItem,
  armour: ShopItem,
): LoadoutOutcome {
  const at = 0
  const day = dayKey(at)
  const hits: BossHitLogEntry[] = []
  const base: LoadoutOutcome = {
    weapon,
    armour,
    defeated: false,
    survivingHp: 0,
    playerMaxHp: 100 + (armour.maxHpBonus ?? 0),
    damagePerTurn: weapon.damage ?? 0,
    incomingPerTurn: Math.max(1, boss.attack - (armour.defense ?? 0)),
  }

  for (let index = 0; index < MAX_SIMULATED_HITS; index += 1) {
    hits.push({
      id: `sim-${index}`,
      kind: 'boss-hit',
      bossId: boss.id,
      weaponId: weapon.id,
      armourId: armour.id,
      at: at + index,
      day,
    })
    const progress = computeBossProgress(hits).find((p) => p.boss.id === boss.id)
    if (!progress) break

    if (progress.defeated) {
      return { ...base, hitsToWin: index + 1, survivingHp: progress.playerHp }
    }
    // A loss resets the attempt, so the first one is the honest answer.
    if (progress.losses > 0) return { ...base, defeated: true }
  }

  return base
}

/** Every owned loadout ranked for one boss: wins first, then fewest taps. */
export function rankLoadouts(
  boss: Boss,
  ownedItemIds: Set<string>,
): LoadoutOutcome[] {
  const outcomes: LoadoutOutcome[] = []
  for (const weapon of ownedWeapons(ownedItemIds)) {
    for (const armour of ownedArmour(ownedItemIds)) {
      outcomes.push(simulateLoadout(boss, weapon, armour))
    }
  }
  return outcomes.sort(compareOutcomes)
}

function compareOutcomes(a: LoadoutOutcome, b: LoadoutOutcome): number {
  const aWins = a.hitsToWin !== undefined
  const bWins = b.hitsToWin !== undefined
  if (aWins !== bWins) return aWins ? -1 : 1
  if (aWins && bWins) {
    // Fewest taps wins; surviving health breaks ties so the safer kit is first.
    return a.hitsToWin! - b.hitsToWin! || b.survivingHp - a.survivingHp
  }
  // Neither wins: prefer whichever survives the exchange over one that dies.
  return Number(a.defeated) - Number(b.defeated)
}

export interface LoadoutAdvice {
  best?: LoadoutOutcome
  /** True when nothing currently owned can clear this boss. */
  needsBetterGear: boolean
}

/** The kit to recommend for a boss, given only what the player already owns. */
export function recommendLoadout(
  boss: Boss,
  ownedItemIds: Set<string>,
): LoadoutAdvice {
  const best = rankLoadouts(boss, ownedItemIds)[0]
  return { best, needsBetterGear: best?.hitsToWin === undefined }
}

/** Purchase ids extracted from a ledger, for feeding the functions above. */
export function ownedIdsFromLedger(entries: LogEntry[]): Set<string> {
  return new Set(
    entries.flatMap((entry) => (entry.kind === 'purchase' ? [entry.itemId] : [])),
  )
}
