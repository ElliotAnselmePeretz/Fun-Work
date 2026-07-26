import type { Activity, Badge, LogEntry, SessionLogEntry, StreakInfo } from '../types'
import { computeCoinSummary } from './coins'
import { computeProgress } from './xp'

export const STREAK_THRESHOLDS = [3, 7, 14, 30, 100] as const
export const COIN_THRESHOLDS = [100, 500, 1000, 5000] as const

/**
 * Badge ids are deterministic rather than random, so re-running the evaluation
 * is idempotent: an already-earned badge produces the same id and is filtered
 * out. That means we can safely evaluate everything after every single log.
 */
export const badgeId = {
  firstLog: () => 'first-log',
  levelUp: (activityId: string, levelIndex: number) =>
    `level:${activityId}:${levelIndex}`,
  streak: (days: number) => `streak:${days}`,
  activityComplete: (activityId: string) => `complete:${activityId}`,
  /** Keeps the old prefix so already-earned XP badges migrate without duplicates. */
  coinTotal: (coins: number) => `xp:${coins}`,
}

interface EvaluateInput {
  activities: Activity[]
  logs: SessionLogEntry[]
  ledgerEntries: LogEntry[]
  streak: StreakInfo
  earnedIds: Set<string>
}

/** Every badge the current state deserves but hasn't been given yet. */
export function evaluateBadges({
  activities,
  logs,
  ledgerEntries,
  streak,
  earnedIds,
}: EvaluateInput): Badge[] {
  const now = Date.now()
  const candidates: Omit<Badge, 'earnedAt'>[] = []

  if (logs.length > 0) {
    candidates.push({
      id: badgeId.firstLog(),
      kind: 'first-log',
      title: 'First Step',
      description: 'Logged your very first session.',
    })
  }

  for (const days of STREAK_THRESHOLDS) {
    // Use the longest run, not the current one — a badge already earned should
    // never feel revoked just because a streak later lapsed.
    if (streak.longest >= days) {
      candidates.push({
        id: badgeId.streak(days),
        kind: 'streak',
        title: `${days}-Day Streak`,
        description: `Kept the flame alive for ${days} days in a row.`,
      })
    }
  }

  const totalCoins = computeCoinSummary(ledgerEntries, activities).earned
  for (const coins of COIN_THRESHOLDS) {
    if (totalCoins >= coins) {
      candidates.push({
        id: badgeId.coinTotal(coins),
        kind: 'coin-total',
        title: `${coins.toLocaleString()} Coins`,
        description: `Earned ${coins.toLocaleString()} total coins.`,
      })
    }
  }

  const logsByActivity = groupBy(logs, (log) => log.activityId)
  for (const activity of activities) {
    const progress = computeProgress(activity, logsByActivity.get(activity.id) ?? [])

    for (let i = 0; i < progress.currentLevelIndex; i++) {
      candidates.push({
        id: badgeId.levelUp(activity.id, i),
        kind: 'level-up',
        title: `${activity.name}: ${activity.levels[i]?.name ?? `Level ${i + 1}`}`,
        description: `Cleared a level in ${activity.name}.`,
        subjectId: activity.id,
      })
    }

    if (progress.isComplete && activity.levels.length > 0) {
      candidates.push({
        id: badgeId.activityComplete(activity.id),
        kind: 'activity-complete',
        title: `${activity.name} Mastered`,
        description: `Completed every level of ${activity.name}.`,
        subjectId: activity.id,
      })
    }
  }

  return candidates
    .filter((badge) => !earnedIds.has(badge.id))
    .map((badge) => ({ ...badge, earnedAt: now }))
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}
