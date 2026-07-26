import type { GameIconName } from '../components/GameIcon'
import type { BossHitLogEntry, Id, LogEntry } from '../types'
import { getArmour, getRelic, getWeapon } from './shop'

/**
 * What the boss does on a given turn. The move is derived from the boss and the
 * turn number, never stored, so the arena can show the player what is coming
 * next and a replay always reaches the same schedule.
 */
export type BossMoveKind = 'strike' | 'heavy' | 'brace' | 'drain'

export interface BossMove {
  kind: BossMoveKind
  name: string
  /** One line shown on the stage while this move is telegraphed. */
  hint: string
  icon: GameIconName
  /** Multiplier on the boss's attack for this turn. */
  attackMultiplier: number
  /** Multiplier on the damage the player lands into this turn. */
  incomingMultiplier: number
  /** Share of the damage it deals that the boss heals back. */
  lifesteal: number
}

export const BOSS_MOVES: Record<BossMoveKind, BossMove> = {
  strike: {
    kind: 'strike',
    name: 'Strike',
    hint: 'An ordinary blow. Trade hits.',
    icon: 'sword',
    attackMultiplier: 1,
    incomingMultiplier: 1,
    lifesteal: 0,
  },
  heavy: {
    kind: 'heavy',
    name: 'Heavy blow',
    hint: 'Winding up. Guard, or take almost double.',
    icon: 'hammer',
    attackMultiplier: 1.8,
    incomingMultiplier: 1,
    lifesteal: 0,
  },
  brace: {
    kind: 'brace',
    name: 'Brace',
    hint: 'Shielded. Your damage is halved — a good turn to guard.',
    icon: 'shield',
    attackMultiplier: 0.6,
    incomingMultiplier: 0.5,
    lifesteal: 0,
  },
  drain: {
    kind: 'drain',
    name: 'Drain',
    hint: 'It heals from whatever it takes off you.',
    icon: 'flame',
    attackMultiplier: 1,
    incomingMultiplier: 1,
    lifesteal: 0.5,
  },
}

/** What the player did on a turn. Stored on the event; everything else derives. */
export type PlayerAction = 'strike' | 'guard'

/** How well a strike was timed against the arena's swing meter. */
export type StrikeTiming = 'weak' | 'good' | 'perfect'

/**
 * `good` is exactly 1, so a player who never engages with the meter — including
 * anyone on the reduced-motion path, which always resolves to `good` — fights
 * at the same baseline the balance numbers are tuned around.
 */
export const TIMING_MULTIPLIER: Record<StrikeTiming, number> = {
  weak: 0.6,
  good: 1,
  perfect: 1.4,
}

/** Share of a boss blow that still lands through a raised guard. */
const GUARD_DAMAGE_TAKEN = 0.3

/**
 * Share of the damage a guard turns aside that comes back as health.
 *
 * Deliberately keyed to the blow that was blocked rather than to max health:
 * guarding a telegraphed heavy is worth a lot, guarding a light one is worth
 * almost nothing, and a guard turn is never a net gain. That gives weapons —
 * which heal for nothing — a way to survive a long fight without letting a
 * starter blade out-sustain an endgame boss by simply never attacking.
 */
const GUARD_RECOVERY = 0.35

/**
 * Turns of grace before a boss starts escalating, and how much of its base
 * attack it gains per turn after that.
 *
 * Without this, guarding plus a healing staff out-sustains a low-damage
 * rotation forever: the cheapest kit that could beat The Rime Fiend was a
 * 375-coin staff poking away for 73 turns, which made a mid-ladder boss
 * cheaper to clear than the one before it. Enrage puts a clock on every fight,
 * so a loadout has to be able to *kill* the boss rather than merely outlast it.
 *
 * It is a pure function of the turn index, like the rotation, so nothing about
 * it is stored — and it is applied only on the tactical path, so no turn
 * recorded under the older rules is re-scored.
 */
export const ENRAGE_AFTER = 14
const ENRAGE_STEP = 0.12

/** How hard the boss swings on a given turn of an attempt, as a multiplier. */
export function enrageMultiplier(turnIndex: number): number {
  return 1 + Math.max(0, turnIndex - ENRAGE_AFTER + 1) * ENRAGE_STEP
}

export interface Boss {
  id: Id
  name: string
  title: string
  maxHp: number
  attack: number
  coinReward: number
  icon: GameIconName
  accent: string
  art: string
  /** Cycled by turn number. Early bosses keep it simple on purpose. */
  pattern: BossMoveKind[]
}

export interface CombatTurn {
  playerDamage: number
  bossDamage: number
  healing: number
  critical: boolean
  lost: boolean
  /** Absent on turns replayed under the older rules. */
  move?: BossMoveKind
  action?: PlayerAction
  timing?: StrikeTiming
  /** Health the boss stole back on a drain turn. */
  bossHealed: number
  /** The relic name when its positive perk fired on this turn. */
  relicTriggered?: string
  /** True when a Phoenix Feather prevented this turn from ending the attempt. */
  revived?: boolean
}

export interface BossProgress {
  boss: Boss
  damageTaken: number
  remainingHp: number
  fraction: number
  defeated: boolean
  locked: boolean
  hitCount: number
  attemptHits: number
  attemptNumber: number
  losses: number
  playerHp: number
  playerMaxHp: number
  armourId?: Id
  relicId?: Id
  strikeCount: number
  relicChargeUsed: boolean
  lastTurn?: CombatTurn
  /** Newest first, for the battle log. Derived like everything else. */
  recentTurns: CombatTurn[]
  /** What the boss will do on the next turn of this attempt. */
  nextMove: BossMove
  /** Where the next turn sits in the boss's rotation. */
  nextMoveIndex: number
  /** A presentation phase derived from remaining health; never persisted. */
  phase: BossPhase
}

export interface BossPhase {
  number: 1 | 2 | 3
  name: string
  description: string
}

export function phaseFor(boss: Boss, remainingHp: number): BossPhase {
  const health = remainingHp / boss.maxHp
  if (health <= 0.33) {
    return {
      number: 3,
      name: 'Desperate',
      description: 'Final phase — the boss is close to breaking.',
    }
  }
  if (health <= 0.66) {
    return {
      number: 2,
      name: 'Enraged',
      description: 'Second phase — read every telegraphed move.',
    }
  }
  return {
    number: 1,
    name: 'Awakened',
    description: 'First phase — learn the attack pattern.',
  }
}

/** How many turns the battle log keeps. */
const LOG_LENGTH = 6

/**
 * The campaign ladder. The four original bosses keep their ids *and* their
 * exact health, attack and reward, because those numbers are replay inputs —
 * changing one could turn a recorded victory into a defeat. The six new bosses
 * are woven between them, so an existing save gains challenges rather than
 * having its history reinterpreted.
 */
export const BOSSES: Boss[] = [
  {
    id: 'training-sentinel',
    name: 'The Sentinel',
    title: 'Gatekeeper of the first arena',
    maxHp: 40,
    attack: 16,
    coinReward: 35,
    icon: 'shield',
    accent: '#4c8df6',
    art: '/assets/bosses/sentinel.png',
    pattern: ['strike'],
  },
  {
    id: 'hollow-brigand',
    name: 'Grimjaw the Ravager',
    title: 'Raider of the low road',
    maxHp: 75,
    attack: 20,
    coinReward: 55,
    icon: 'axe',
    accent: '#c0803a',
    art: '/assets/bosses/hollow-brigand.png',
    pattern: ['strike', 'strike', 'heavy'],
  },
  {
    id: 'iron-golem',
    name: 'Iron Golem',
    title: 'A mountain of plated steel',
    maxHp: 120,
    attack: 25,
    coinReward: 90,
    icon: 'castle',
    accent: '#6c5ce7',
    art: '/assets/bosses/iron-golem.png',
    pattern: ['strike', 'brace', 'strike', 'heavy'],
  },
  {
    id: 'mirefang-hydra',
    name: 'Mirefang',
    title: 'Nine heads, one appetite',
    maxHp: 190,
    attack: 31,
    coinReward: 140,
    icon: 'flame',
    accent: '#3fae6b',
    art: '/assets/bosses/mirefang.png',
    pattern: ['strike', 'drain', 'strike', 'heavy'],
  },
  {
    id: 'storm-warden',
    name: 'Storm Warden',
    title: 'Keeper of the charged tower',
    maxHp: 280,
    attack: 38,
    coinReward: 210,
    icon: 'zap',
    accent: '#1cb0f6',
    art: '/assets/bosses/storm-warden.png',
    pattern: ['strike', 'brace', 'heavy', 'strike'],
  },
  {
    id: 'ember-lord',
    name: 'Emberlord Vask',
    title: 'The fire that walks the ridge',
    maxHp: 400,
    attack: 45,
    coinReward: 300,
    icon: 'flame',
    accent: '#ff5a2b',
    art: '/assets/bosses/ember-lord.png',
    pattern: ['heavy', 'strike', 'drain', 'strike'],
  },
  {
    id: 'rime-fiend',
    name: 'The Rime Fiend',
    title: 'Winter given a body',
    maxHp: 520,
    attack: 58,
    coinReward: 390,
    icon: 'sparkles',
    accent: '#7fd8ff',
    art: '/assets/bosses/rime-fiend.png',
    pattern: ['strike', 'brace', 'heavy', 'brace'],
  },
  {
    id: 'void-king',
    name: 'The Void King',
    title: 'Crowned ruler of the dark arena',
    maxHp: 650,
    attack: 55,
    coinReward: 500,
    icon: 'crown',
    accent: '#8b5cf6',
    art: '/assets/bosses/void-king.png',
    pattern: ['heavy', 'drain', 'strike', 'brace'],
  },
  {
    id: 'gilded-wyrm',
    name: 'The Gilded Wyrm',
    title: 'Hoard-queen of the sunspire',
    maxHp: 900,
    attack: 56,
    coinReward: 700,
    icon: 'trophy',
    accent: '#ffb020',
    art: '/assets/bosses/gilded-wyrm.png',
    pattern: ['heavy', 'strike', 'brace', 'drain', 'strike'],
  },
  {
    id: 'starfall-tyrant',
    name: 'The Starfall Tyrant',
    title: 'Last crown of the far reach',
    maxHp: 1150,
    attack: 52,
    coinReward: 1000,
    icon: 'swords',
    accent: '#ff3d6e',
    art: '/assets/bosses/starfall-tyrant.png',
    pattern: ['heavy', 'brace', 'drain', 'heavy', 'strike'],
  },
]

export function isBossHitLog(log: LogEntry): log is BossHitLogEntry {
  return log.kind === 'boss-hit'
}

/** The boss's move for a turn, derived from the rotation — never stored. */
export function moveFor(boss: Boss, turnIndex: number): BossMove {
  return BOSS_MOVES[boss.pattern[turnIndex % boss.pattern.length]]
}

/**
 * Everything one attempt needs in order to resolve its next turn. Derived from
 * the ledger on every read; nothing here is ever written to the database.
 */
export interface AttemptState {
  remainingHp: number
  playerHp: number
  playerMaxHp: number
  /** Adopted from the first non-legacy turn and locked for the attempt. */
  armourId?: Id
  /** Adopted from the first relic-enabled turn and locked for the attempt. */
  relicId?: Id
  /** Turns already taken, which drives both the crit rhythm and the rotation. */
  attemptHits: number
  /** Non-guard actions, used by rhythm relics and derived during replay. */
  strikeCount: number
  /** Whether this attempt has already spent its one-use survival relic. */
  relicChargeUsed: boolean
  defeated: boolean
  /** Attempts lost so far against this boss. */
  losses: number
}

/** A full-health attempt, before any armour has been committed to it. */
export function freshAttempt(boss: Boss): AttemptState {
  return {
    remainingHp: boss.maxHp,
    playerHp: 100,
    playerMaxHp: 100,
    attemptHits: 0,
    strikeCount: 0,
    relicChargeUsed: false,
    defeated: false,
    losses: 0,
  }
}

/**
 * Resolves exactly one recorded turn. This is the single source of truth for
 * combat: the ledger replay below and the balance simulator in `loadout.ts`
 * both drive it, so a predicted fight and a real one cannot disagree.
 *
 * Turns resolve under the rules that were in force when they were recorded,
 * which is why this reads three ways:
 *
 * 1. No `armourId` — the original rules: no retaliation, no criticals.
 * 2. `armourId` but no `action` — retaliation and criticals, no tactics.
 * 3. `action` present — the tactical arena: boss moves, guarding, timing.
 *
 * The tier is decided per event, so a recorded win can never be revoked by a
 * later rules change, and one attempt may legitimately mix tiers.
 */
export function resolveTurn(
  boss: Boss,
  state: AttemptState,
  hit: BossHitLogEntry,
): { state: AttemptState; turn: CombatTurn } {
  const legacyHit = hit.armourId === undefined
  let {
    remainingHp,
    playerHp,
    playerMaxHp,
    armourId,
    relicId,
    relicChargeUsed,
  } = state
  const attemptHits = state.attemptHits

  if (!legacyHit && armourId === undefined) {
    const armour = getArmour(hit.armourId) ?? getArmour('traveler-guard')
    armourId = armour?.id
    playerMaxHp = 100 + (armour?.maxHpBonus ?? 0)
    playerHp = playerMaxHp
  }
  if (!legacyHit && relicId === undefined) {
    relicId = getRelic(hit.relicId)?.id
  }

  const weapon = getWeapon(hit.weaponId)
  const tactical = !legacyHit && hit.action !== undefined
  const move = moveFor(boss, attemptHits)
  const guarding = tactical && hit.action === 'guard'
  const strikeCount = state.strikeCount + (guarding ? 0 : 1)
  const timing: StrikeTiming = hit.timing ?? 'good'
  const relic = tactical ? getRelic(relicId) : undefined
  const relicEffect = relic?.relicEffect
  const tacticalFields = tactical
    ? { move: move.kind, action: hit.action, timing: hit.timing }
    : undefined

  const critical =
    !legacyHit &&
    !guarding &&
    weapon?.critEvery !== undefined &&
    (attemptHits + 1) % weapon.critEvery === 0
  const baseDamage = (weapon?.damage ?? 0) * (critical ? 2 : 1)
  let relicDamageMultiplier = 1
  let relicTriggered: string | undefined

  if (!guarding && relicEffect === 'duelist-prism') {
    if (timing === 'perfect') {
      relicDamageMultiplier = 1.3
      relicTriggered = relic?.name
    } else if (timing === 'weak') {
      relicDamageMultiplier = 0.8
    }
  } else if (
    !guarding &&
    relicEffect === 'ember-crown' &&
    remainingHp / boss.maxHp <= 0.33
  ) {
    relicDamageMultiplier = 1.3
    relicTriggered = relic?.name
  } else if (!guarding && relicEffect === 'phoenix-feather') {
    relicDamageMultiplier = 0.9
  } else if (!guarding && relicEffect === 'echo-stone') {
    if (strikeCount % 3 === 0) {
      relicDamageMultiplier = 1.4
      relicTriggered = relic?.name
    } else {
      relicDamageMultiplier = 0.95
    }
  }

  const playerDamage = guarding
    ? 0
    : tactical
      ? Math.round(
          baseDamage *
            TIMING_MULTIPLIER[timing] *
            move.incomingMultiplier *
            relicDamageMultiplier,
        )
      : baseDamage

  remainingHp = Math.max(0, remainingHp - playerDamage)

  if (remainingHp === 0) {
    const relicHealing =
      relicEffect === 'moon-vial' && timing === 'perfect' ? 12 : 0
    if (relicHealing > 0) relicTriggered = relic?.name
    const healing = legacyHit
      ? 0
      : Math.min(
          (weapon?.healing ?? 0) + relicHealing,
          playerMaxHp - playerHp,
        )
    playerHp += healing
    return {
      state: {
        ...state,
        remainingHp,
        playerHp,
        playerMaxHp,
        armourId,
        relicId,
        attemptHits: attemptHits + 1,
        strikeCount,
        relicChargeUsed,
        defeated: true,
      },
      turn: {
        playerDamage,
        bossDamage: 0,
        healing,
        critical,
        lost: false,
        bossHealed: 0,
        relicTriggered,
        ...tacticalFields,
      },
    }
  }

  // Older hits predate retaliation; preserving them avoids revoking wins.
  const guardValue = getArmour(armourId)?.defense ?? 0
  let bossDamage = 0
  let blocked = 0
  if (tactical) {
    const swing = Math.max(
      1,
      Math.round(
        boss.attack * move.attackMultiplier * enrageMultiplier(attemptHits),
      ) - guardValue,
    )
    const defendedDamage = guarding
      ? Math.max(1, Math.round(swing * GUARD_DAMAGE_TAKEN))
      : swing
    bossDamage =
      relicEffect === 'ember-crown'
        ? Math.max(1, Math.round(defendedDamage * 1.1))
        : defendedDamage
    blocked = guarding ? Math.max(0, swing - bossDamage) : 0
  } else if (!legacyHit) {
    bossDamage = Math.max(1, boss.attack - guardValue)
  }

  playerHp = Math.max(0, playerHp - bossDamage)
  let lost = playerHp === 0
  let revived = false
  if (
    lost &&
    relicEffect === 'phoenix-feather' &&
    relicChargeUsed === false
  ) {
    playerHp = 1
    lost = false
    revived = true
    relicChargeUsed = true
    relicTriggered = relic?.name
  }

  const wardRecovery =
    guarding && relicEffect === 'wayfarer-ward'
      ? Math.round(blocked * 0.15)
      : 0
  const vialRecovery =
    !guarding && relicEffect === 'moon-vial' && timing === 'perfect' ? 12 : 0
  if (wardRecovery > 0 || vialRecovery > 0) relicTriggered = relic?.name
  const recovered =
    (weapon?.healing ?? 0) +
    Math.round(blocked * GUARD_RECOVERY) +
    wardRecovery +
    vialRecovery
  const healing =
    legacyHit || lost || revived
      ? 0
      : Math.min(recovered, playerMaxHp - playerHp)
  playerHp += healing

  // A drain turn gives back part of what it took, capped by the damage already
  // dealt so the boss can never climb back above full health.
  const bossHealed = tactical
    ? Math.min(Math.round(bossDamage * move.lifesteal), boss.maxHp - remainingHp)
    : 0
  remainingHp += bossHealed

  const turn: CombatTurn = {
    playerDamage,
    bossDamage,
    healing,
    critical,
    lost,
    bossHealed,
    relicTriggered,
    revived,
    ...tacticalFields,
  }

  // A defeat costs the attempt, never the ledger: health, armour and the
  // rotation all reset, and no coins change hands.
  if (lost) {
    return {
      state: { ...freshAttempt(boss), losses: state.losses + 1 },
      turn,
    }
  }

  return {
    state: {
      ...state,
      remainingHp,
      playerHp,
      playerMaxHp,
      armourId,
      relicId,
      attemptHits: attemptHits + 1,
      strikeCount,
      relicChargeUsed,
    },
    turn,
  }
}

/** Replays every hit to derive health, locks and victories from the ledger. */
export function computeBossProgress(entries: LogEntry[]): BossProgress[] {
  const hits = entries
    .filter(isBossHitLog)
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
  let previousDefeated = true

  return BOSSES.map((boss) => {
    const bossHits = hits.filter((hit) => hit.bossId === boss.id)
    let state = freshAttempt(boss)
    let lastTurn: CombatTurn | undefined
    const recentTurns: CombatTurn[] = []

    for (const hit of bossHits) {
      if (state.defeated) break
      const resolved = resolveTurn(boss, state, hit)
      state = resolved.state
      lastTurn = resolved.turn
      recentTurns.unshift(resolved.turn)
      if (recentTurns.length > LOG_LENGTH) recentTurns.pop()
    }

    const damageTaken = boss.maxHp - state.remainingHp
    const progress: BossProgress = {
      boss,
      damageTaken,
      remainingHp: state.remainingHp,
      fraction: Math.min(1, damageTaken / boss.maxHp),
      defeated: state.defeated,
      // A boss you have already beaten is never re-locked, even when a newer
      // boss is inserted ahead of it in the ladder.
      locked: !previousDefeated && !state.defeated,
      hitCount: bossHits.length,
      attemptHits: state.attemptHits,
      attemptNumber: state.losses + 1,
      losses: state.losses,
      playerHp: state.playerHp,
      playerMaxHp: state.playerMaxHp,
      armourId: state.armourId,
      relicId: state.relicId,
      strikeCount: state.strikeCount,
      relicChargeUsed: state.relicChargeUsed,
      lastTurn,
      recentTurns,
      nextMove: moveFor(boss, state.attemptHits),
      nextMoveIndex: state.attemptHits % boss.pattern.length,
      phase: phaseFor(boss, state.remainingHp),
    }
    previousDefeated = state.defeated
    return progress
  })
}

export function totalBossRewards(entries: LogEntry[]): number {
  return computeBossProgress(entries)
    .filter((progress) => progress.defeated)
    .reduce((sum, progress) => sum + progress.boss.coinReward, 0)
}
