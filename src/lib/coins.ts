import type {
  Activity,
  Id,
  LogEntry,
  PurchaseLogEntry,
  SessionLogEntry,
  StreakInfo,
} from '../types'
import { totalBossRewards } from './bosses'
import { addDays } from './date'
import { totalTrialRewards } from './trials'

/**
 * A habit session. Held at its original value on purpose: this number is a
 * replay input, so lowering it would retroactively shrink a balance the user
 * has already earned and possibly spent.
 */
export const COINS_PER_SESSION = 10

/**
 * Finishing a work item. Worth more than a habit session because it only ever
 * pays once — a habit keeps earning every day, a work item is banked and gone.
 * It takes no streak multiplier for the same reason: there is no streak to
 * keep on something you do a single time.
 */
export const COINS_PER_WORK = 25

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
  /** Coins from cleared streak trials. See lib/trials.ts. */
  trialEarned: number
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
export function computeCoinSummary(
  entries: LogEntry[],
  activities: Activity[] = [],
): CoinSummary {
  const sessions = entries.filter(isSessionLog)
  const rewardsByLogId = new Map<string, CoinReward>()
  const earnedByActivityId = new Map<string, number>()
  // Anything not listed as work is a habit, which also covers rows written
  // before the split and any log whose activity has since been deleted.
  const workIds = new Set<Id>(
    activities.filter((a) => a.kind === 'work').map((a) => a.id),
  )
  // Only habits build the streak. Clearing a backlog of one-off jobs is not a
  // daily practice, and letting it feed the multiplier would make the whole
  // streak — and every trial keyed to it — trivially farmable.
  const streakByDay = streakLengthByDay(
    sessions.filter((log) => !workIds.has(log.activityId)),
  )

  let sessionEarned = 0
  for (const log of sessions) {
    const isWorkLog = workIds.has(log.activityId)
    const streakDays = streakByDay.get(log.day) ?? 1
    const multiplier = isWorkLog ? 1 : coinMultiplierForStreak(streakDays)
    const coins = isWorkLog
      ? COINS_PER_WORK
      : Math.round(COINS_PER_SESSION * multiplier)
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
  const trialEarned = totalTrialRewards(entries, activities)
  const earned = sessionEarned + bossEarned + trialEarned

  return {
    earned,
    sessionEarned,
    bossEarned,
    trialEarned,
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
