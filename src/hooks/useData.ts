import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { computeCoinSummary, isSessionLog } from '../lib/coins'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import { byOrder } from '../lib/ordering'
import { computeStreak } from '../lib/streak'
import { computeProgress } from '../lib/xp'
import type {
  Activity,
  ActivityProgress,
  Badge,
  Category,
  LogEntry,
  SessionLogEntry,
} from '../types'

/**
 * Live reads of the whole dataset. The volumes here are tiny — a few hundred
 * activities and a few thousand logs at most — so loading it all and deriving
 * in memory is far simpler than maintaining narrow indexed queries, and stays
 * instant.
 */

export function useCategories(): Category[] | undefined {
  return useLiveQuery(async () => (await db.categories.toArray()).sort(byOrder), [])
}

export function useActivities(): Activity[] | undefined {
  return useLiveQuery(async () => (await db.activities.toArray()).sort(byOrder), [])
}

/** Session completions only. Purchase ledger entries are intentionally hidden. */
export function useLogs(): SessionLogEntry[] | undefined {
  return useLiveQuery(
    async () => (await db.logs.toArray()).filter(isSessionLog),
    [],
  )
}

export function useLedgerEntries(): LogEntry[] | undefined {
  return useLiveQuery(() => db.logs.toArray(), [])
}

export function useBadges() {
  return useLiveQuery(
    async () =>
      (await db.badges.toArray())
        .map(presentCoinBadge)
        .sort((a, b) => b.earnedAt - a.earnedAt),
    [],
  )
}

export function useSettings() {
  return useLiveQuery(async () => (await db.settings.get('singleton')) ?? DEFAULT_SETTINGS, [])
}

export function useActivity(activityId: string): Activity | undefined | null {
  return useLiveQuery(
    async () => (await db.activities.get(activityId)) ?? null,
    [activityId],
  )
}

export function useActivityLogs(activityId: string): SessionLogEntry[] | undefined {
  return useLiveQuery(
    async () =>
      (await db.logs.where('activityId').equals(activityId).toArray()).filter(
        isSessionLog,
      ),
    [activityId],
  )
}

/**
 * The streak, built from habit sessions only. Work items are one-off jobs, so
 * counting them would let a burst of admin carry a daily practice — and every
 * trial keyed to this streak with it.
 */
export function useStreak() {
  const logs = useLogs()
  const activities = useActivities()
  return useMemo(() => {
    if (!logs || !activities) return undefined
    const workIds = new Set(
      activities.filter((a) => a.kind === 'work').map((a) => a.id),
    )
    return computeStreak(logs.filter((log) => !workIds.has(log.activityId)))
  }, [logs, activities])
}

export function useCoinSummary() {
  const entries = useLedgerEntries()
  const activities = useActivities()
  return useMemo(
    () => (entries && activities ? computeCoinSummary(entries, activities) : undefined),
    [entries, activities],
  )
}

/** Progress for every activity, keyed by activity id. */
export function useProgressMap(): Map<string, ActivityProgress> | undefined {
  const activities = useActivities()
  const logs = useLogs()

  return useMemo(() => {
    if (!activities || !logs) return undefined
    const byActivity = new Map<string, SessionLogEntry[]>()
    for (const log of logs) {
      const bucket = byActivity.get(log.activityId)
      if (bucket) bucket.push(log)
      else byActivity.set(log.activityId, [log])
    }
    return new Map(
      activities.map((activity) => [
        activity.id,
        computeProgress(activity, byActivity.get(activity.id) ?? []),
      ]),
    )
  }, [activities, logs])
}

/** Most recent logs first, capped. Powers the dashboard's recent list. */
export function useRecentLogs(limit = 8): SessionLogEntry[] | undefined {
  return useLiveQuery(
    async () =>
      (await db.logs.orderBy('at').reverse().toArray())
        .filter(isSessionLog)
        .slice(0, limit),
    [limit],
  )
}

function presentCoinBadge(badge: Badge): Badge {
  if (badge.kind !== 'xp-total') return badge
  const target = Number(badge.id.split(':').at(-1))
  const amount = Number.isFinite(target) ? target.toLocaleString() : ''
  return {
    ...badge,
    kind: 'coin-total',
    title: `${amount} Coins`,
    description: `Earned ${amount} total coins.`,
  }
}
