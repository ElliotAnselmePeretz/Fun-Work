import { evaluateBadges } from '../../lib/badges'
import { computeCoinSummary, isSessionLog } from '../../lib/coins'
import { dayKey } from '../../lib/date'
import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { computeStreak } from '../../lib/streak'
import { computeProgress } from '../../lib/xp'
import type { Badge, Id, SessionLogEntry } from '../../types'

export interface LogResult {
  coinsGained: number
  /** Set when this log cleared a level — the name of the level just finished. */
  levelCleared: string | null
  newBadges: Badge[]
}

/**
 * Log one session. This is the app's central write: it appends the log, then
 * re-derives badges from scratch. Deriving rather than incrementing means a
 * badge can never be missed or double-awarded if a write is interrupted.
 */
export async function logSession(activityId: Id, note?: string): Promise<LogResult> {
  return db.transaction(
    'rw',
    [db.activities, db.logs, db.badges],
    async (): Promise<LogResult> => {
      const activity = await db.activities.get(activityId)
      if (!activity) throw new Error(`Unknown activity: ${activityId}`)

      const priorLogs = (
        await db.logs.where('activityId').equals(activityId).toArray()
      ).filter(isSessionLog)
      const before = computeProgress(activity, priorLogs)

      const now = Date.now()
      const entry: SessionLogEntry = {
        id: newId(),
        kind: 'session',
        activityId,
        at: now,
        day: dayKey(now),
        ...(note?.trim() ? { note: note.trim() } : {}),
      }
      await db.logs.add(entry)

      const after = computeProgress(activity, [...priorLogs, entry])
      const levelCleared =
        after.currentLevelIndex > before.currentLevelIndex
          ? (activity.levels[before.currentLevelIndex]?.name ?? null)
          : null

      const [activities, ledgerEntries, earned] = await Promise.all([
        db.activities.toArray(),
        db.logs.toArray(),
        db.badges.toArray(),
      ])
      const allLogs = ledgerEntries.filter(isSessionLog)

      const newBadges = evaluateBadges({
        activities,
        logs: allLogs,
        ledgerEntries,
        streak: computeStreak(allLogs),
        earnedIds: new Set(earned.map((badge) => badge.id)),
      })
      if (newBadges.length > 0) await db.badges.bulkAdd(newBadges)

      const coinsGained =
        computeCoinSummary(ledgerEntries, activities).rewardsByLogId.get(entry.id)
          ?.coins ?? 0
      return { coinsGained, levelCleared, newBadges }
    },
  )
}

/** Remove a single log — the undo path for a mis-tap. */
export async function deleteLog(logId: Id): Promise<void> {
  await db.logs.delete(logId)
}

/**
 * Re-run badge evaluation without logging. Needed after edits that can change
 * progress retroactively, e.g. renaming levels or deleting a log.
 */
export async function refreshBadges(): Promise<Badge[]> {
  const [activities, ledgerEntries, earned] = await Promise.all([
    db.activities.toArray(),
    db.logs.toArray(),
    db.badges.toArray(),
  ])
  const logs = ledgerEntries.filter(isSessionLog)
  const newBadges = evaluateBadges({
    activities,
    logs,
    ledgerEntries,
    streak: computeStreak(logs),
    earnedIds: new Set(earned.map((badge) => badge.id)),
  })
  if (newBadges.length > 0) await db.badges.bulkAdd(newBadges)
  return newBadges
}
