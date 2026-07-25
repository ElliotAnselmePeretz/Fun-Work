/** Stable ids are generated client-side; see lib/id.ts. */
export type Id = string

/** A top-level grouping, e.g. "Physical" or "Schoolwork". */
export interface Category {
  id: Id
  name: string
  emoji: string
  /** Hex color, drives the category's accent throughout the UI. */
  color: string
  /** Ascending; gaps are fine. See lib/ordering.ts. */
  order: number
  createdAt: number
}

/** One rung on an activity's progression path. */
export interface Level {
  id: Id
  name: string
  /** Sessions needed to clear this level (not cumulative). */
  sessionsRequired: number
}

/** Something trackable inside a category, e.g. "Running" or "Math AA". */
export interface Activity {
  id: Id
  categoryId: Id
  name: string
  emoji: string
  levels: Level[]
  order: number
  createdAt: number
  archivedAt?: number
}

/** One completion. The unit of progress — one tap, one row. */
export interface SessionLogEntry {
  id: Id
  /** Missing on older backups; missing or `session` means a completion. */
  kind?: 'session'
  activityId: Id
  /** Epoch ms. */
  at: number
  /** Local calendar day as YYYY-MM-DD, for streak and stats grouping. */
  day: string
  /** Legacy field kept so existing backups remain importable. Coins are derived. */
  xp?: number
  note?: string
}

/**
 * A shop purchase is a ledger event, not a stored balance. Available coins and
 * ownership are always re-derived from session and purchase history.
 */
export interface PurchaseLogEntry {
  id: Id
  kind: 'purchase'
  itemId: Id
  coinCost: number
  at: number
  day: string
}

/** One weapon swing. Boss health and victories are replayed from these events. */
export interface BossHitLogEntry {
  id: Id
  kind: 'boss-hit'
  bossId: Id
  weaponId: Id
  at: number
  day: string
}

export type LogEntry = SessionLogEntry | PurchaseLogEntry | BossHitLogEntry

export type BadgeKind =
  | 'first-log'
  | 'level-up'
  | 'streak'
  | 'activity-complete'
  | 'coin-total'
  /** Kept for older IndexedDB rows; presented as coin badges at read time. */
  | 'xp-total'

export interface Badge {
  /** Deterministic — see features/badges/badgeDefs.ts. Doubles as the dedupe key. */
  id: Id
  kind: BadgeKind
  title: string
  description: string
  emoji: string
  earnedAt: number
  /** Activity or category this badge refers to, when relevant. */
  subjectId?: Id
}

export interface Settings {
  id: 'singleton'
  /** Stored locally only, never bundled. Used for the image import feature. */
  anthropicApiKey?: string
  /** Sessions logged per day to keep the streak alive. */
  dailyGoal: number
}

/** Derived, never stored — computed from session logs. See lib/xp.ts. */
export interface ActivityProgress {
  activityId: Id
  totalSessions: number
  /** Index into activity.levels. Equals levels.length when fully complete. */
  currentLevelIndex: number
  /** Sessions completed within the current level. */
  sessionsIntoLevel: number
  /** Sessions the current level needs; 0 when the activity is complete. */
  sessionsForLevel: number
  isComplete: boolean
}

/** Derived, never stored — computed from logs. See lib/streak.ts. */
export interface StreakInfo {
  current: number
  longest: number
  /** True when the user has already logged something today. */
  loggedToday: boolean
  /** Day strings that have at least one log, most recent first. */
  activeDays: string[]
}
