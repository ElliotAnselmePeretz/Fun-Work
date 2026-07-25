import {
  BOSS_MOVES,
  freshAttempt,
  moveFor,
  resolveTurn,
  type Boss,
  type BossMove,
  type PlayerAction,
} from './bosses'
import { dayKey } from './date'
import { ownedArmour, ownedWeapons, type ShopItem } from './shop'
import type { BossHitLogEntry, LogEntry } from '../types'

/**
 * How a loadout actually performs, measured by replaying it through the same
 * combat code the arena uses. Nothing here is stored — it is a what-if run over
 * synthetic turns, so the answer can never disagree with a real fight.
 */
export interface LoadoutOutcome {
  weapon: ShopItem
  armour: ShopItem
  /** Turns needed to win, or undefined if this loadout cannot win at all. */
  hitsToWin?: number
  /** True when the player's health runs out before the boss's does. */
  defeated: boolean
  /** Health left at the moment of victory. */
  survivingHp: number
  playerMaxHp: number
  /** Averaged across the boss's rotation, since moves change both numbers. */
  damagePerTurn: number
  incomingPerTurn: number
  /** Turns the reference player spent guarding instead of striking. */
  guardTurns: number
}

/** Turns are only ever simulated this far before a loadout is called hopeless. */
const MAX_SIMULATED_HITS = 400

/** Health left after eating the telegraphed blow, if the player just strikes. */
function hpAfterTaking(
  boss: Boss,
  move: BossMove,
  armour: ShopItem,
  playerHp: number,
): number {
  const swing = Math.max(
    1,
    Math.round(boss.attack * move.attackMultiplier) - (armour.defense ?? 0),
  )
  return playerHp - swing
}

/**
 * The reference player this harness measures against. It reads the telegraph
 * and answers it the way an attentive player would:
 *
 * - Guard a heavy blow when eating it would leave health uncomfortably low.
 *   Guarding costs a turn of damage, so it is spent on the blow that actually
 *   threatens rather than on a fixed health percentage.
 * - Guard through a brace when badly hurt: the boss's damage is halved on that
 *   turn anyway, which makes it the cheapest turn on the rotation to give up.
 *
 * Timing always resolves to `good`, the 1.0 multiplier, so these numbers
 * describe competent play rather than a perfect run.
 */
function chooseAction(
  boss: Boss,
  move: BossMove,
  armour: ShopItem,
  playerHp: number,
  playerMaxHp: number,
): PlayerAction {
  if (move.kind === 'heavy') {
    return hpAfterTaking(boss, move, armour, playerHp) <= playerMaxHp * 0.5
      ? 'guard'
      : 'strike'
  }
  if (move.kind === 'brace' && playerHp < playerMaxHp * 0.4) return 'guard'
  return 'strike'
}

/** Mean of a boss's per-move multipliers, for the at-a-glance numbers. */
function averageOverRotation(
  boss: Boss,
  read: (move: BossMove) => number,
): number {
  const total = boss.pattern.reduce(
    (sum, kind) => sum + read(BOSS_MOVES[kind]),
    0,
  )
  return total / boss.pattern.length
}

/**
 * Replays a fresh attempt against `boss` through `resolveTurn` — the very same
 * function the ledger replay uses, one turn at a time.
 *
 * The synthetic turns carry an armourId and an action, so they take the current
 * tactical path rather than either legacy one: this measures how a fight would
 * go today, not how an old log replays.
 */
export function simulateLoadout(
  boss: Boss,
  weapon: ShopItem,
  armour: ShopItem,
): LoadoutOutcome {
  const at = 0
  const day = dayKey(at)
  const playerMaxHp = 100 + (armour.maxHpBonus ?? 0)
  const base: LoadoutOutcome = {
    weapon,
    armour,
    defeated: false,
    survivingHp: 0,
    playerMaxHp,
    damagePerTurn: Math.round(
      (weapon.damage ?? 0) *
        averageOverRotation(boss, (move) => move.incomingMultiplier),
    ),
    incomingPerTurn: Math.round(
      averageOverRotation(boss, (move) =>
        Math.max(
          1,
          Math.round(boss.attack * move.attackMultiplier) -
            (armour.defense ?? 0),
        ),
      ),
    ),
    guardTurns: 0,
  }

  // Seeded with this armour's health pool. `resolveTurn` adopts the same armour
  // on the first turn and lands on identical numbers; pre-seeding only means the
  // reference player judges turn one against the pool it will actually have.
  let state = { ...freshAttempt(boss), playerHp: playerMaxHp, playerMaxHp }
  let guardTurns = 0

  for (let index = 0; index < MAX_SIMULATED_HITS; index += 1) {
    const move = moveFor(boss, state.attemptHits)
    const action = chooseAction(boss, move, armour, state.playerHp, playerMaxHp)
    if (action === 'guard') guardTurns += 1

    const hit: BossHitLogEntry = {
      id: `sim-${index}`,
      kind: 'boss-hit',
      bossId: boss.id,
      weaponId: weapon.id,
      armourId: armour.id,
      action,
      ...(action === 'strike' ? { timing: 'good' as const } : undefined),
      at: at + index,
      day,
    }
    const resolved = resolveTurn(boss, state, hit)
    state = resolved.state

    if (state.defeated) {
      return {
        ...base,
        hitsToWin: index + 1,
        survivingHp: state.playerHp,
        guardTurns,
      }
    }
    // A loss resets the attempt, so the first one is the honest answer.
    if (resolved.turn.lost) return { ...base, defeated: true, guardTurns }
  }

  return { ...base, guardTurns }
}

/** Every owned loadout ranked for one boss: wins first, then fewest turns. */
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
    // Fewest turns wins; surviving health breaks ties so the safer kit is first.
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
