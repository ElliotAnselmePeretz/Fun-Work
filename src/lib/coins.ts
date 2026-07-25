import type {
  LogEntry,
  PurchaseLogEntry,
  SessionLogEntry,
  StreakInfo,
} from '../types'
import { totalBossRewards } from './bosses'
import { addDays } from './date'

export const COINS_PER_SESSION = 10

export type CoinMultiplier = 1 | 1.5 | 2 | 2.5 | 3

export interface CoinReward {
  coins: number
  multiplier: CoinMultiplier
  streakDays: number
}

export interface CoinSummary {
  /** All coins ever earned from sessions and boss victories. */
  earned: number
  sessionEarned: number
  bossEarned: number
  spent: number
  /** Spendable coins. Clamped at zero if old session logs are later deleted. */
  balance: number
  rewardsByLogId: Map<string, CoinReward>
  earnedByActivityId: Map<string, number>
  ownedItemIds: Set<string>
}

export function isSessionLog(log: LogEntry): log is SessionLogEntry {
  return log.kind === undefined || log.kind === 'session'
}

export function isPurchaseLog(log: LogEntry): log is PurchaseLogEntry {
  return log.kind === 'purchase'
}

/** Streak tiers are intentionally memorable and always produce whole coins. */
export function coinMultiplierForStreak(days: number): CoinMultiplier {
  if (days >= 30) return 3
  if (days >= 14) return 2.5
  if (days >= 7) return 2
  if (days >= 3) return 1.5
  return 1
}

/**
 * The reward for the next tap. If today's link has not been made yet, the tap
 * advances the streak by one; later taps today keep the same tier.
 */
export function nextCoinMultiplier(streak: StreakInfo): CoinMultiplier {
  const days = streak.current + (streak.loggedToday ? 0 : 1)
  return coinMultiplierForStreak(Math.max(days, 1))
}

export function multiplierLabel(multiplier: CoinMultiplier): string {
  return Number.isInteger(multiplier)
    ? `${multiplier.toFixed(0)}×`
    : `${multiplier.toFixed(1)}×`
}

/**
 * Replays the ledger from history. No balance, streak boost, or owned-item
 * counter is stored anywhere, so edits and restores always recompute cleanly.
 */
export function computeCoinSummary(entries: LogEntry[]): CoinSummary {
  const sessions = entries.filter(isSessionLog)
  const streakByDay = streakLengthByDay(sessions)
  const rewardsByLogId = new Map<string, CoinReward>()
  const earnedByActivityId = new Map<string, number>()

  let sessionEarned = 0
  for (const log of sessions) {
    const streakDays = streakByDay.get(log.day) ?? 1
    const multiplier = coinMultiplierForStreak(streakDays)
    const coins = Math.round(COINS_PER_SESSION * multiplier)
    rewardsByLogId.set(log.id, { coins, multiplier, streakDays })
    sessionEarned += coins
    earnedByActivityId.set(
      log.activityId,
      (earnedByActivityId.get(log.activityId) ?? 0) + coins,
    )
  }

  const purchases = entries.filter(isPurchaseLog)
  const spent = purchases.reduce((sum, purchase) => sum + purchase.coinCost, 0)
  const bossEarned = totalBossRewards(entries)
  const earned = sessionEarned + bossEarned

  return {
    earned,
    sessionEarned,
    bossEarned,
    spent,
    balance: Math.max(0, earned - spent),
    rewardsByLogId,
    earnedByActivityId,
    ownedItemIds: new Set(purchases.map((purchase) => purchase.itemId)),
  }
}

function streakLengthByDay(logs: SessionLogEntry[]): Map<string, number> {
  const days = [...new Set(logs.map((log) => log.day))].sort()
  const result = new Map<string, number>()
  let previous: string | null = null
  let run = 0

  for (const day of days) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1
    result.set(day, run)
    previous = day
  }
  return result
}
