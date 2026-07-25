import type { SessionLogEntry, StreakInfo } from '../types'
import { addDays, todayKey } from './date'

/**
 * A streak is consecutive calendar days with at least one log.
 *
 * Today not being logged yet does *not* break the streak — you still have the
 * rest of the day. So the run is allowed to start at either today or
 * yesterday; anything older means the chain is already broken.
 */
export function computeStreak(logs: SessionLogEntry[]): StreakInfo {
  const days = new Set(logs.map((log) => log.day))
  const sorted = [...days].sort().reverse()
  const today = todayKey()
  const loggedToday = days.has(today)

  let current = 0
  let cursor = loggedToday ? today : addDays(today, -1)
  while (days.has(cursor)) {
    current += 1
    cursor = addDays(cursor, -1)
  }

  return {
    current,
    longest: longestRun(sorted),
    loggedToday,
    activeDays: sorted,
  }
}

/** `sorted` must be day keys, newest first. */
function longestRun(sorted: string[]): number {
  let longest = 0
  let run = 0
  let previous: string | null = null

  for (const day of sorted) {
    run = previous !== null && addDays(previous, -1) === day ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }
  return longest
}

/** The last `count` days ending today, oldest first — for the week strip. */
export function recentDayWindow(count: number): string[] {
  const today = todayKey()
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1))
}
