import { evaluateBadges } from '../../lib/badges'
import { computeCoinSummary, isSessionLog } from '../../lib/coins'
import { dayKey, todayKey } from '../../lib/date'
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
/**
 * Records a session on a past day, or removes the ones already there.
 *
 * Forgetting to tick is not the same as not doing it, and a tracker that
 * cannot be corrected quietly lies about your history — and breaks a streak
 * you actually kept. The event carries the chosen `day` and a timestamp inside
 * it, so every derived number replays exactly as if it had been logged then.
 */
export async function toggleSessionOn(
  activityId: Id,
  day: string,
): Promise<'added' | 'removed'> {
  return db.transaction('rw', [db.activities, db.logs], async () => {
    const activity = await db.activities.get(activityId)
    if (!activity) throw new Error(`Unknown activity: ${activityId}`)
    if (day > todayKey()) throw new Error('That day has not happened yet.')

    const existing = (
      await db.logs.where('activityId').equals(activityId).toArray()
    )
      .filter(isSessionLog)
      .filter((entry) => entry.day === day)

    if (existing.length > 0) {
      await db.logs.bulkDelete(existing.map((entry) => entry.id))
      return 'removed'
    }

    // Noon on the chosen day, so the timestamp cannot drift into a neighbour
    // when it is later read back in a different timezone.
    const [year, month, date] = day.split('-').map(Number)
    const entry: SessionLogEntry = {
      id: newId(),
      kind: 'session',
      activityId,
      at: new Date(year, month - 1, date, 12).getTime(),
      day,
    }
    await db.logs.add(entry)
    return 'added'
  })
}

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
