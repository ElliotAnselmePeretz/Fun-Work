import type { GameIconName } from '../components/GameIcon'
import type { BossHitLogEntry, Id, LogEntry } from '../types'
import { getArmour, getWeapon } from './shop'

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
}

export interface CombatTurn {
  playerDamage: number
  bossDamage: number
  healing: number
  critical: boolean
  lost: boolean
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
  lastTurn?: CombatTurn
}

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
  },
  {
    id: 'void-king',
    name: 'The Void King',
    title: 'Final ruler of the dark arena',
    maxHp: 650,
    attack: 55,
    coinReward: 500,
    icon: 'crown',
    accent: '#8b5cf6',
    art: '/assets/bosses/void-king.png',
  },
]

export function isBossHitLog(log: LogEntry): log is BossHitLogEntry {
  return log.kind === 'boss-hit'
}

/** Replays every hit to derive health, locks and victories from the ledger. */
export function computeBossProgress(entries: LogEntry[]): BossProgress[] {
  const hits = entries
    .filter(isBossHitLog)
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
  let previousDefeated = true

  return BOSSES.map((boss) => {
    const bossHits = hits.filter((hit) => hit.bossId === boss.id)
    let remainingHp = boss.maxHp
    let playerMaxHp = 100
    let playerHp = playerMaxHp
    let armourId: Id | undefined
    let attemptHits = 0
    let losses = 0
    let defeated = false
    let lastTurn: CombatTurn | undefined

    for (const hit of bossHits) {
      if (defeated) break

      const legacyHit = hit.armourId === undefined
      if (!legacyHit && armourId === undefined) {
        const armour =
          getArmour(hit.armourId) ?? getArmour('traveler-guard')
        armourId = armour?.id
        playerMaxHp = 100 + (armour?.maxHpBonus ?? 0)
        playerHp = playerMaxHp
      }

      const weapon = getWeapon(hit.weaponId)
      const critical =
        !legacyHit &&
        weapon?.critEvery !== undefined &&
        (attemptHits + 1) % weapon.critEvery === 0
      const playerDamage = (weapon?.damage ?? 0) * (critical ? 2 : 1)
      remainingHp = Math.max(0, remainingHp - playerDamage)
      attemptHits += 1

      if (remainingHp === 0) {
        const healing = legacyHit
          ? 0
          : Math.min(weapon?.healing ?? 0, playerMaxHp - playerHp)
        playerHp += healing
        defeated = true
        lastTurn = {
          playerDamage,
          bossDamage: 0,
          healing,
          critical,
          lost: false,
        }
        continue
      }

      // Older hits predate retaliation; preserving them avoids revoking wins.
      const armour = getArmour(armourId)
      const bossDamage = legacyHit
        ? 0
        : Math.max(1, boss.attack - (armour?.defense ?? 0))
      playerHp = Math.max(0, playerHp - bossDamage)
      const lost = playerHp === 0
      const healing =
        legacyHit || lost
          ? 0
          : Math.min(weapon?.healing ?? 0, playerMaxHp - playerHp)
      playerHp += healing
      lastTurn = { playerDamage, bossDamage, healing, critical, lost }

      if (lost) {
        losses += 1
        remainingHp = boss.maxHp
        playerMaxHp = 100
        playerHp = playerMaxHp
        armourId = undefined
        attemptHits = 0
      }
    }

    const damageTaken = boss.maxHp - remainingHp
    const progress: BossProgress = {
      boss,
      damageTaken,
      remainingHp,
      fraction: Math.min(1, damageTaken / boss.maxHp),
      defeated,
      locked: !previousDefeated,
      hitCount: bossHits.length,
      attemptHits,
      attemptNumber: losses + 1,
      losses,
      playerHp,
      playerMaxHp,
      armourId,
      lastTurn,
    }
    previousDefeated = defeated
    return progress
  })
}

export function totalBossRewards(entries: LogEntry[]): number {
  return computeBossProgress(entries)
    .filter((progress) => progress.defeated)
    .reduce((sum, progress) => sum + progress.boss.coinReward, 0)
}
