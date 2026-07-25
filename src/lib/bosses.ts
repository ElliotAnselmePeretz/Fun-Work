import type { GameIconName } from '../components/GameIcon'
import type { BossHitLogEntry, Id, LogEntry } from '../types'
import { getShopItem } from './shop'

export interface Boss {
  id: Id
  name: string
  title: string
  maxHp: number
  coinReward: number
  icon: GameIconName
  accent: string
}

export interface BossProgress {
  boss: Boss
  damageTaken: number
  remainingHp: number
  fraction: number
  defeated: boolean
  locked: boolean
  hitCount: number
}

export const BOSSES: Boss[] = [
  {
    id: 'training-sentinel',
    name: 'The Sentinel',
    title: 'Gatekeeper of the first arena',
    maxHp: 40,
    coinReward: 35,
    icon: 'shield',
    accent: '#4c8df6',
  },
  {
    id: 'iron-golem',
    name: 'Iron Golem',
    title: 'A mountain of plated steel',
    maxHp: 120,
    coinReward: 90,
    icon: 'castle',
    accent: '#6c5ce7',
  },
  {
    id: 'storm-warden',
    name: 'Storm Warden',
    title: 'Keeper of the charged tower',
    maxHp: 280,
    coinReward: 210,
    icon: 'zap',
    accent: '#1cb0f6',
  },
  {
    id: 'void-king',
    name: 'The Void King',
    title: 'Final ruler of the dark arena',
    maxHp: 650,
    coinReward: 500,
    icon: 'crown',
    accent: '#8b5cf6',
  },
]

export function isBossHitLog(log: LogEntry): log is BossHitLogEntry {
  return log.kind === 'boss-hit'
}

/** Replays every hit to derive health, locks and victories from the ledger. */
export function computeBossProgress(entries: LogEntry[]): BossProgress[] {
  const hits = entries.filter(isBossHitLog)
  let previousDefeated = true

  return BOSSES.map((boss) => {
    const bossHits = hits.filter((hit) => hit.bossId === boss.id)
    const damageTaken = bossHits.reduce(
      (sum, hit) => sum + (getShopItem(hit.weaponId)?.damage ?? 0),
      0,
    )
    const defeated = damageTaken >= boss.maxHp
    const progress: BossProgress = {
      boss,
      damageTaken,
      remainingHp: Math.max(0, boss.maxHp - damageTaken),
      fraction: Math.min(1, damageTaken / boss.maxHp),
      defeated,
      locked: !previousDefeated,
      hitCount: bossHits.length,
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
