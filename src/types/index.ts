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

export type ActivityDifficulty = 'gentle' | 'standard' | 'hard' | 'legendary'

/**
 * The two halves of the app.
 *
 * A **habit** is a standing commitment — "the gym, four times a week". You
 * tick it off, and the only question is whether you kept pace this week. It
 * has no levels, no difficulty and no journey, because it is never finished.
 *
 * **Work** is the opposite: something you are working *through* and will one
 * day be done with. That is what carries levels, a difficulty rating and the
 * journey through the biomes.
 */
export type ActivityKind = 'habit' | 'work'

/**
 * The commitment behind a habit: how many times a week you agreed to do it.
 *
 * This is a *definition*, so it is stored. How many you have actually done,
 * and whether that keeps pace, is always derived. See lib/goals.ts.
 */
export interface HabitGoal {
  /** Times a week you agreed to do this. The habit's whole target. */
  weeklyTarget?: number
  /** Lifetime sessions to aim for. Optional, and never resets. */
  totalTarget?: number
  /**
   * Days in a row to aim for. Retained so habits created before the weekly
   * commitment became the primary target keep rendering their old goal.
   */
  streakTarget?: number
}

/** Something trackable inside a category, e.g. "Running" or "Math AA". */
export interface Activity {
  id: Id
  categoryId: Id
  name: string
  emoji: string
  /**
   * Controls the pacing of auto-generated levels. Optional so existing
   * IndexedDB rows and backups keep their original behaviour.
   */
  difficulty?: ActivityDifficulty
  /** Missing on rows written before the split, which are all habits. */
  kind?: ActivityKind
  /** Habits only. Work items are done or not done; they have nothing to aim at. */
  goal?: HabitGoal
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

/**
 * One combat turn. Boss health, player health, critical hits, and defeats are
 * replayed from these events; none of those values are stored as counters.
 */
export interface BossHitLogEntry {
  id: Id
  kind: 'boss-hit'
  bossId: Id
  weaponId: Id
  /**
   * Missing on older ledgers. Legacy hits keep their original no-retaliation
   * behavior so this combat upgrade cannot revoke an earned boss victory.
   */
  armourId?: Id
  /**
   * Optional for backward compatibility. New tactical turns record the relic
   * chosen for that attempt; its effects are always replayed from this event.
   */
  relicId?: Id
  /**
   * What the player chose to do. Missing on turns recorded before the tactical
   * arena, which replay without boss moves or guarding — the same reason
   * `armourId` is optional. Boss moves, damage and healing are all still
   * derived; only the choice itself has to persist.
   */
  action?: 'strike' | 'guard'
  /** How well the strike was timed. Only meaningful alongside `action`. */
  timing?: 'weak' | 'good' | 'perfect'
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
  /**
   * Legacy. Badges are drawn from their `kind` now — see features/badges/
   * badgeIcon.ts — but the field stays readable so older rows and backups
   * still import cleanly.
   */
  emoji?: string
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
