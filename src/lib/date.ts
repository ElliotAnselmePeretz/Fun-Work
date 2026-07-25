/**
 * Streaks are a human, local-calendar concept, so every day key here is
 * derived from the device's local time — never UTC. A log at 23:00 and one at
 * 01:00 must land on different days for the person who made them.
 */

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Parse a YYYY-MM-DD key back into a local-midnight Date. */
export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Shift a day key by whole days. Handles DST and month/year edges. */
export function addDays(key: string, delta: number): string {
  const d = dayKeyToDate(key)
  d.setDate(d.getDate() + delta)
  return dayKey(d)
}

/** Whole days between two keys; positive when `b` is later than `a`. */
export function daysBetween(a: string, b: string): number {
  const ms = dayKeyToDate(b).getTime() - dayKeyToDate(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function todayKey(): string {
  return dayKey()
}

/** e.g. "Mon", used by the streak calendar strip. */
export function weekdayLabel(key: string): string {
  return dayKeyToDate(key).toLocaleDateString(undefined, { weekday: 'short' })
}

/** Friendly relative label for recent-activity rows. */
export function relativeDayLabel(key: string): string {
  const diff = daysBetween(key, todayKey())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return dayKeyToDate(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
