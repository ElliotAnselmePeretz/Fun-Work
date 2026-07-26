import type { Activity, HabitGoal, Id, SessionLogEntry } from '../types'
import { addDays, todayKey } from './date'
import { computeStreak } from './streak'

/**
 * Goal tracking for habits.
 *
 * The *targets* are definitions and live on the activity. Everything about how
 * far along you are is derived from session logs on every read, so editing a
 * target never rewrites history and restoring a backup always recomputes
 * cleanly.
 */

/** One goal line: where you are, what you were aiming at, and whether it's met. */
export interface GoalTrack {
  done: number
  target: number
  /** Clamped to 1 so a bar never overflows when you beat the target. */
  fraction: number
  met: boolean
}

export interface GoalProgress {
  /** Consecutive days, against a target run. Legacy habits only. */
  streak?: GoalTrack
  /** Sessions inside the current week, against the agreed pace. */
  weekly?: GoalTrack
  /** Lifetime sessions, which never reset. */
  total?: GoalTrack
  /** Consecutive weeks the commitment was met. Zero without a weekly target. */
  weeksKept: number
  /** True when the habit has no targets set at all. */
  empty: boolean
}

function track(done: number, target?: number): GoalTrack | undefined {
  if (!target || target <= 0) return undefined
  return {
    done,
    target,
    fraction: Math.min(1, done / target),
    met: done >= target,
  }
}

/** The current week as day keys, Monday first. */
export function currentWeekDays(): string[] {
  const today = todayKey()
  // `todayKey` is YYYY-MM-DD in local time; parse it back the same way.
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  // getDay() is 0 for Sunday, so shift to a Monday-first index.
  const offset = (date.getDay() + 6) % 7
  const monday = addDays(today, -offset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Sessions logged for one activity inside the current week. */
export function sessionsThisWeek(logs: SessionLogEntry[]): number {
  const week = new Set(currentWeekDays())
  return logs.filter((log) => week.has(log.day)).length
}

/** The Monday of the week a given day falls in. */
function weekStart(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const offset = (new Date(year, month - 1, date).getDay() + 6) % 7
  return addDays(day, -offset)
}

/**
 * Consecutive weeks where the commitment was met, most recent first.
 *
 * This is the honest streak for a habit. A day-streak punishes you for the
 * rest days a three-times-a-week commitment is *supposed* to have; counting
 * weeks only asks the question the habit actually agreed to.
 *
 * The current week never breaks the run — it is still in progress, so it
 * either extends the streak or is simply not counted yet.
 */
export function weeklyStreak(logs: SessionLogEntry[], target: number): number {
  if (target <= 0) return 0

  const counts = new Map<string, number>()
  for (const log of logs) {
    const week = weekStart(log.day)
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }

  const thisWeek = weekStart(todayKey())
  let cursor = thisWeek
  let run = 0

  // Only count the week in progress if it has already hit the target.
  if ((counts.get(cursor) ?? 0) >= target) run += 1
  cursor = addDays(cursor, -7)

  while ((counts.get(cursor) ?? 0) >= target) {
    run += 1
    cursor = addDays(cursor, -7)
  }
  return run
}

/**
 * How a habit is doing against everything it aims at.
 *
 * `logs` must already be filtered to this activity — the caller usually has
 * them grouped anyway, and filtering here would rescan the whole ledger per
 * habit.
 */
export function computeGoalProgress(
  goal: HabitGoal | undefined,
  logs: SessionLogEntry[],
): GoalProgress {
  if (!goal) return { weeksKept: 0, empty: true }

  const streak = computeStreak(logs)
  const progress: GoalProgress = {
    streak: track(streak.current, goal.streakTarget),
    weekly: track(sessionsThisWeek(logs), goal.weeklyTarget),
    total: track(logs.length, goal.totalTarget),
    weeksKept: weeklyStreak(logs, goal.weeklyTarget ?? 0),
    empty: false,
  }
  progress.empty = !progress.streak && !progress.weekly && !progress.total
  return progress
}

/** Session logs bucketed by activity, so per-habit reads stay one pass. */
export function logsByActivity(
  logs: SessionLogEntry[],
): Map<Id, SessionLogEntry[]> {
  const buckets = new Map<Id, SessionLogEntry[]>()
  for (const log of logs) {
    const bucket = buckets.get(log.activityId)
    if (bucket) bucket.push(log)
    else buckets.set(log.activityId, [log])
  }
  return buckets
}

/** Habits and work items are the same row type, separated only by `kind`. */
export function isWork(activity: Activity): boolean {
  return activity.kind === 'work'
}

/** Rows written before the split have no `kind` and are all habits. */
export function isHabit(activity: Activity): boolean {
  return activity.kind !== 'work'
}

/**
 * A work item is finished the moment it has been logged once. There is no
 * "done" column to keep in sync — the log *is* the completion.
 */
export function isWorkDone(logs: SessionLogEntry[] | undefined): boolean {
  return (logs?.length ?? 0) > 0
}
