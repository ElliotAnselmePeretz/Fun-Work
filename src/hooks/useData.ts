import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import { byOrder } from '../lib/ordering'
import { computeStreak } from '../lib/streak'
import { computeProgress } from '../lib/xp'
import type { Activity, ActivityProgress, Category, LogEntry } from '../types'

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

export function useLogs(): LogEntry[] | undefined {
  return useLiveQuery(() => db.logs.toArray(), [])
}

export function useBadges() {
  return useLiveQuery(
    async () => (await db.badges.toArray()).sort((a, b) => b.earnedAt - a.earnedAt),
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

export function useActivityLogs(activityId: string): LogEntry[] | undefined {
  return useLiveQuery(
    async () => db.logs.where('activityId').equals(activityId).toArray(),
    [activityId],
  )
}

export function useStreak() {
  const logs = useLogs()
  return useMemo(() => (logs ? computeStreak(logs) : undefined), [logs])
}

export function useTotalXp(): number | undefined {
  const logs = useLogs()
  return useMemo(
    () => (logs ? logs.reduce((sum, log) => sum + log.xp, 0) : undefined),
    [logs],
  )
}

/** Progress for every activity, keyed by activity id. */
export function useProgressMap(): Map<string, ActivityProgress> | undefined {
  const activities = useActivities()
  const logs = useLogs()

  return useMemo(() => {
    if (!activities || !logs) return undefined
    const byActivity = new Map<string, LogEntry[]>()
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
export function useRecentLogs(limit = 8): LogEntry[] | undefined {
  return useLiveQuery(
    async () => db.logs.orderBy('at').reverse().limit(limit).toArray(),
    [limit],
  )
}
